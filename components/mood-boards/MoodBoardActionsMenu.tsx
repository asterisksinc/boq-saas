"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const calculateMenuPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuWidth = 190;
    const menuHeight = onDownload ? 238 : 206;
    const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth));
    const below = rect.bottom + 6;
    const top = below + menuHeight <= window.innerHeight - 8
      ? below
      : Math.max(8, rect.top - menuHeight - 6);
    setMenuPosition({ top, left });
  };

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
      window.addEventListener("resize", calculateMenuPosition);
      window.addEventListener("scroll", calculateMenuPosition, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", calculateMenuPosition);
      window.removeEventListener("scroll", calculateMenuPosition, true);
    };
  }, [isOpen]);

  const openMenu = () => {
    if (!isOpen) calculateMenuPosition();
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="mb-actions-wrap" ref={menuRef}>
      <button
        type="button"
        className="mb-actions-btn"
        ref={buttonRef}
        aria-label={`Actions for ${moodBoard.name}`}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          openMenu();
        }}
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          className="mb-dropdown-menu mb-dropdown-menu-fixed"
          role="menu"
          style={menuPosition}
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
        </div>,
        document.body
      )}
    </div>
  );
}
