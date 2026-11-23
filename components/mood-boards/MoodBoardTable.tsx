"use client";

import React from "react";
import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import { MoodBoard } from "@/lib/mood-boards/types";
import { formatRelativeDate } from "@/lib/mood-boards/helpers";
import MoodBoardStatusBadge from "./MoodBoardStatusBadge";
import MoodBoardActionsMenu from "./MoodBoardActionsMenu";

interface MoodBoardTableProps {
  moodBoards: MoodBoard[];
  onView: (id: string) => void;
  onEdit: (mb: MoodBoard) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (mb: MoodBoard) => void;
  onDownload?: (mb: MoodBoard) => void;
}

export default function MoodBoardTable({
  moodBoards,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onDownload,
}: MoodBoardTableProps) {
  return (
    <div className="mb-table-scroll">
      <table className="mb-table" aria-label="Mood boards list">
        <colgroup>
          <col className="mb-col-moodboard" />
          <col className="mb-col-project" />
          <col className="mb-col-client" />
          <col className="mb-col-images" />
          <col className="mb-col-status" />
          <col className="mb-col-created" />
          <col className="mb-col-updated" />
          <col className="mb-col-actions" />
        </colgroup>
        <thead className="mb-thead">
          <tr>
            <th className="mb-th mb-th-moodboard">
              MOODBOARD
            </th>
            <th className="mb-th mb-th-project">
              PROJECT
            </th>
            <th className="mb-th mb-th-client">
              CLIENT
            </th>
            <th className="mb-th mb-th-images">
              IMAGES
            </th>
            <th className="mb-th mb-th-status">
              STATUS
            </th>
            <th className="mb-th mb-th-created">
              CREATED BY
            </th>
            <th className="mb-th mb-th-updated">
              LAST UPDATED
            </th>
            <th className="mb-th mb-th-actions">
              <span className="sr-only">ACTIONS</span>
            </th>
          </tr>
        </thead>
        <tbody className="mb-tbody">
          {moodBoards.map((board) => (
            <tr
              key={board.id}
              onClick={() => onView(board.id)}
              style={{ cursor: "pointer" }}
            >
              {/* Mood Board Name */}
              <td className="mb-td mb-cell-name">
                <Link
                  href={`/mood-boards/${board.id}`}
                  className="mb-cell-name-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {board.name}
                </Link>
              </td>

              {/* Project */}
              <td className="mb-td mb-cell-project">
                {board.projectName}
              </td>

              {/* Client */}
              <td className="mb-td mb-cell-client">
                <span className="mb-client-primary">{board.clientName}</span>
                {board.clientSubtitle && (
                  <span className="mb-client-sub">{board.clientSubtitle}</span>
                )}
              </td>

              {/* Images */}
              <td className="mb-td mb-cell-images">
                <span className="mb-images-content">
                  <ImageIcon size={16} color="#475569" />
                  <span>{board.images ? board.images.length : 0}</span>
                </span>
              </td>

              {/* Status */}
              <td className="mb-td">
                <MoodBoardStatusBadge status={board.status} />
              </td>

              {/* Created By */}
              <td className="mb-td mb-cell-creator">
                {board.createdBy}
              </td>

              {/* Last Updated */}
              <td className="mb-td mb-cell-updated">
                {formatRelativeDate(board.updatedAt)}
              </td>

              {/* Actions Menu */}
              <td
                className="mb-td mb-cell-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoodBoardActionsMenu
                  moodBoard={board}
                  onView={onView}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onArchive={onArchive}
                  onDelete={onDelete}
                  onDownload={onDownload}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
