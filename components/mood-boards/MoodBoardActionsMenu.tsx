"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Eye, Edit3, Copy, Archive, Trash2, Download } from "lucide-react";
import { MoodBoard } from "@/lib/mood-boards/types";

interface MoodBoardActionsMenuProps {
  moodBoard: MoodBoard;
  onView: (id: string) => void;
  onEdit: (mb: MoodBoard) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (mb: MoodBoard) => void;
  onDownload?: (mb: MoodBoard) => void;
}

export default function MoodBoardActionsMenu({
  moodBoard,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onDownload,
}: MoodBoardActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="mb-actions-wrap" ref={menuRef}>
      <button
        type="button"
        className="mb-actions-btn"
        aria-label={`Actions for ${moodBoard.name}`}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && (
        <div
          className="mb-dropdown-menu"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="mb-dropdown-item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onView(moodBoard.id);
            }}
          >
            <Eye size={15} />
            <span>View Mood Board</span>
          </button>

          <button
            type="button"
            className="mb-dropdown-item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onEdit(moodBoard);
            }}
          >
            <Edit3 size={15} />
            <span>Edit Mood Board</span>
          </button>

          <button
            type="button"
            className="mb-dropdown-item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onDuplicate(moodBoard.id);
            }}
          >
            <Copy size={15} />
            <span>Duplicate</span>
          </button>

          {onDownload && (
            <button
              type="button"
              className="mb-dropdown-item"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onDownload(moodBoard);
              }}
            >
              <Download size={15} />
              <span>Download PDF</span>
            </button>
          )}

          <button
            type="button"
            className="mb-dropdown-item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onArchive(moodBoard.id);
            }}
          >
            <Archive size={15} />
            <span>{moodBoard.status === "ARCHIVED" ? "Unarchive" : "Archive"}</span>
          </button>

          <button
            type="button"
            className="mb-dropdown-item danger"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onDelete(moodBoard);
            }}
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
