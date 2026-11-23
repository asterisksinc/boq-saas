"use client";

import React, { Suspense } from "react";
import DashboardRail from "@/components/DashboardRail";
import MoodBoardsPage from "@/components/mood-boards/MoodBoardsPage";
import "@/app/mood-boards/mood-boards.css";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="fig-dashboard mood-boards-page">
          <div className="fig-dashboard-glow mood-boards-bg-glow" />
          <DashboardRail />
          <div className="fig-dashboard-main">
            <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>
              Loading mood boards…
            </div>
          </div>
        </main>
      }
    >
      <MoodBoardsPage rail={<DashboardRail />} />
    </Suspense>
  );
}
