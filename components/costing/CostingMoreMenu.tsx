"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Edit2, Copy, Trash2, Eye } from "lucide-react";

export interface MoreMenuAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface CostingMoreMenuProps {
  entityName?: string;
  onView?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  customActions?: MoreMenuAction[];
  align?: "right" | "left";
}

export default function CostingMoreMenu({
  entityName,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  customActions,
  align = "right",
}: CostingMoreMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 160;
      let left = align === "right" ? rect.right - menuWidth : rect.left;

      // Prevent offscreen
      if (left + menuWidth > window.innerWidth - 12) {
        left = window.innerWidth - menuWidth - 12;
      }
      if (left < 12) {
        left = 12;
      }

      setPos({
        top: rect.bottom + window.scrollY + 4,
        left,
      });
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const defaultActions: MoreMenuAction[] = [];
  if (onView) {
    defaultActions.push({
      label: "View",
      icon: <Eye size={15} />,
      onClick: onView,
    });
  }
  if (onEdit) {
    defaultActions.push({
      label: "Edit",
      icon: <Edit2 size={15} />,
      onClick: onEdit,
    });
  }
  if (onDuplicate) {
    defaultActions.push({
      label: "Duplicate",
      icon: <Copy size={15} />,
      onClick: onDuplicate,
    });
  }
  if (onDelete) {
    defaultActions.push({
      label: "Delete",
      icon: <Trash2 size={15} />,
      onClick: onDelete,
      danger: true,
    });
  }

  const allActions = customActions || defaultActions;

  if (allActions.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#94a3b8",
          padding: "6px",
          borderRadius: "6px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          outline: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#1e293b";
          e.currentTarget.style.background = "#f1f5f9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#94a3b8";
          e.currentTarget.style.background = "transparent";
        }}
        title="More actions"
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              zIndex: 99999,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
              padding: "4px",
              minWidth: "150px",
              animation: "fadeIn 0.1s ease-out",
            }}
          >
            {allActions.map((act, index) => (
              <button
                key={index}
                type="button"
                disabled={act.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  act.onClick();
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: act.disabled ? "not-allowed" : "pointer",
                  color: act.danger ? "#ef4444" : "#334155",
                  fontSize: "13px",
                  fontWeight: 500,
                  opacity: act.disabled ? 0.5 : 1,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!act.disabled) {
                    e.currentTarget.style.background = act.danger ? "#fef2f2" : "#f8fafc";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!act.disabled) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {act.icon}
                <span>{act.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
