"use client";

import { use, Suspense } from "react";
import DashboardRail from "@/components/DashboardRail";
import MoodBoardDetail from "@/components/mood-boards/MoodBoardDetail";
import "../mood-boards.css";

export default function MoodBoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <main className="fig-dashboard mood-boards-page">
          <div className="fig-dashboard-glow mood-boards-bg-glow" />
          <DashboardRail current="/mood-boards" />
          <div className="fig-dashboard-main">
            <div style={{ padding: 60, textAlign: "center", color: "#64748B" }}>
              Loading mood board...
            </div>
          </div>
        </main>
      }
    >
      <MoodBoardDetail id={id} rail={<DashboardRail current="/mood-boards" />} />
    </Suspense>
  );
}
