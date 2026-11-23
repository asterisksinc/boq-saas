"use client";

import React from "react";
import Link from "next/link";
import { Image as ImageIcon, Briefcase, User } from "lucide-react";
import { MoodBoard } from "@/lib/mood-boards/types";
import { formatRelativeDate } from "@/lib/mood-boards/helpers";
import MoodBoardStatusBadge from "./MoodBoardStatusBadge";
import MoodBoardActionsMenu from "./MoodBoardActionsMenu";

interface MoodBoardCardProps {
  moodBoard: MoodBoard;
  onView: (id: string) => void;
  onEdit: (mb: MoodBoard) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (mb: MoodBoard) => void;
  onDownload?: (mb: MoodBoard) => void;
}

export default function MoodBoardCard({
  moodBoard,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onDownload,
}: MoodBoardCardProps) {
  const coverUrl =
    moodBoard.coverImage ||
    (moodBoard.images && moodBoard.images.length > 0
      ? moodBoard.images[0].previewUrl
      : "");

  return (
    <div
      className="mb-card"
      onClick={() => onView(moodBoard.id)}
      style={{ cursor: "pointer" }}
    >
      <div className="mb-card-media">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={moodBoard.name}
            className="mb-card-img"
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#E2E8F0",
              color: "#94A3B8",
            }}
          >
            <ImageIcon size={36} />
          </div>
        )}

        <div className="mb-card-img-count">
          <ImageIcon size={13} />
          <span>{moodBoard.images ? moodBoard.images.length : 0} images</span>
        </div>

        <div className="mb-card-status-badge">
          <MoodBoardStatusBadge status={moodBoard.status} />
        </div>
      </div>

      <div className="mb-card-body">
        <div className="mb-card-header-row">
          <Link
            href={`/mood-boards/${moodBoard.id}`}
            className="mb-card-title"
            onClick={(e) => e.stopPropagation()}
          >
            {moodBoard.name}
          </Link>
          <div onClick={(e) => e.stopPropagation()}>
            <MoodBoardActionsMenu
              moodBoard={moodBoard}
              onView={onView}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onArchive={onArchive}
              onDelete={onDelete}
              onDownload={onDownload}
            />
          </div>
        </div>

        <div className="mb-card-meta">
          <div className="mb-card-project" title="Project">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Briefcase size={13} color="#64748B" />
              <span>{moodBoard.projectName}</span>
            </span>
          </div>
          <div className="mb-card-client" title="Client">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <User size={13} color="#64748B" />
              <span>
                {moodBoard.clientName}
                {moodBoard.clientSubtitle ? ` • ${moodBoard.clientSubtitle}` : ""}
              </span>
            </span>
          </div>
        </div>

        <div className="mb-card-footer">
          <span>By {moodBoard.createdBy}</span>
          <span>{formatRelativeDate(moodBoard.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
