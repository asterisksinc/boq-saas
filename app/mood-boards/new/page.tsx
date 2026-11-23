"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardRail from "@/components/DashboardRail";
import MoodBoardTemplateSelection from "@/components/mood-boards/MoodBoardTemplateSelection";
import CreateMoodBoardEditor from "@/components/mood-boards/editor/CreateMoodBoardEditor";
import { MoodBoardTemplate } from "@/lib/mood-boards/types";
import { MOCK_MOOD_BOARD_TEMPLATES } from "@/lib/mood-boards/mock-data";
import "../mood-boards.css";

function NewMoodBoardContent({ rail }: { rail: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode = searchParams.get("mode") === "template" ? "template" : "blank";
  const initialTemplateId = searchParams.get("templateId");

  const [mode, setMode] = useState<"blank" | "template">(initialMode);
  const [selectedTemplate, setSelectedTemplate] = useState<MoodBoardTemplate | null>(() => {
    if (initialTemplateId) {
      return (
        MOCK_MOOD_BOARD_TEMPLATES.find((t) => t.id === initialTemplateId) || null
      );
    }
    return null;
  });

  // Sync mode if query params change
  useEffect(() => {
    const qMode = searchParams.get("mode");
    if (qMode === "template") {
      setMode("template");
    } else if (qMode === "blank") {
      setMode("blank");
    }

    const tplId = searchParams.get("templateId");
    if (tplId) {
      const found = MOCK_MOOD_BOARD_TEMPLATES.find((t) => t.id === tplId);
      if (found) {
        setSelectedTemplate(found);
      }
    }
  }, [searchParams]);

  const handleSelectTemplate = (template: MoodBoardTemplate) => {
    setSelectedTemplate(template);
  };

  return (
    <main className="fig-dashboard mood-boards-page">
      <div className="fig-dashboard-glow mood-boards-bg-glow" />
      {rail}

      <div className="fig-dashboard-main">
        <div className="mood-boards-container">
          {mode === "template" && !selectedTemplate ? (
            <MoodBoardTemplateSelection
              onSelectTemplate={handleSelectTemplate}
              onSwitchToBlank={() => {
                setMode("blank");
                setSelectedTemplate(null);
              }}
            />
          ) : (
            <CreateMoodBoardEditor
              initialTemplate={selectedTemplate}
              mode={mode}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default function NewMoodBoardPage() {
  return (
    <Suspense
      fallback={
        <main className="fig-dashboard mood-boards-page">
          <div className="fig-dashboard-glow mood-boards-bg-glow" />
          <DashboardRail current="/mood-boards" />
          <div className="fig-dashboard-main">
            <div style={{ padding: 60, textAlign: "center", color: "#64748B" }}>
              Loading Mood Board Studio...
            </div>
          </div>
        </main>
      }
    >
      <NewMoodBoardContent rail={<DashboardRail current="/mood-boards" />} />
    </Suspense>
  );
}
