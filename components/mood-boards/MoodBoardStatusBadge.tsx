import React from "react";
import { MoodBoardStatus } from "@/lib/mood-boards/types";

interface MoodBoardStatusBadgeProps {
  status: MoodBoardStatus;
  className?: string;
}

export default function MoodBoardStatusBadge({
  status,
  className = "",
}: MoodBoardStatusBadgeProps) {
  const getStatusConfig = (st: MoodBoardStatus) => {
    switch (st) {
      case "COMPLETED":
        return {
          label: "COMPLETED",
          className: "mb-status-completed",
        };
      case "IN_PROGRESS":
        return {
          label: "IN PROGRESS",
          className: "mb-status-in-progress",
        };
      case "ARCHIVED":
        return {
          label: "ARCHIVED",
          className: "mb-status-archived",
        };
      case "DRAFT":
      default:
        return {
          label: "DRAFT",
          className: "mb-status-draft",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`mb-status-pill ${config.className} ${className}`}
      data-status={status}
    >
      {config.label}
    </span>
  );
}
