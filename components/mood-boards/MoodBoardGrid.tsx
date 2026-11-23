"use client";

import React from "react";
import { MoodBoard } from "@/lib/mood-boards/types";
import MoodBoardCard from "./MoodBoardCard";

interface MoodBoardGridProps {
  moodBoards: MoodBoard[];
  onView: (id: string) => void;
  onEdit: (mb: MoodBoard) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (mb: MoodBoard) => void;
  onDownload?: (mb: MoodBoard) => void;
}

export default function MoodBoardGrid({
  moodBoards,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onDownload,
}: MoodBoardGridProps) {
  return (
    <div className="mb-grid-view">
      {moodBoards.map((board) => (
        <MoodBoardCard
          key={board.id}
          moodBoard={board}
          onView={onView}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onArchive={onArchive}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}
