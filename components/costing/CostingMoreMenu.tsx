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
  entityName = "Item",
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
      const menuWidth = 166;
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
      label: `View ${entityName}`,
      icon: <Eye size={18} color="#64748B" />,
      onClick: onView,
    });
  }
  if (onEdit) {
    defaultActions.push({
      label: "Edit Item",
      icon: <Edit2 size={18} color="#64748B" />,
      onClick: onEdit,
    });
  }
  if (onDuplicate) {
    defaultActions.push({
      label: "Duplicate Item",
      icon: <Copy size={18} color="#64748B" />,
      onClick: onDuplicate,
    });
  }
  if (onDelete) {
    defaultActions.push({
      label: "Delete Item",
      icon: <Trash2 size={18} color="#DC2626" />,
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
          color: "#64748B",
          padding: "6px",
          borderRadius: "6px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          outline: "none",
          width: "32px",
          height: "32px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#0F172A";
          e.currentTarget.style.background = "#E4ECFB";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#64748B";
          e.currentTarget.style.background = "transparent";
        }}
        title="More actions"
        aria-label="More actions"
      >
        <MoreHorizontal size={20} />
      </button>

      {isOpen &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              boxSizing: "border-box",
              position: "absolute",
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              zIndex: 99999,
              width: "166px",
              background: "#FFFFFF",
              border: "1px solid #EBEBEB",
              borderRadius: "16px",
              boxShadow: "0px 16px 32px -12px rgba(14, 18, 27, 0.1)",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
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
                  boxSizing: "border-box",
                  width: "150px",
                  height: "40px",
                  borderRadius: "8px",
                  padding: "8px",
                  background: "transparent",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: act.disabled ? "not-allowed" : "pointer",
                  color: act.danger ? "#DC2626" : "#64748B",
                  fontFamily: "'Urbanist', sans-serif",
                  fontStyle: "normal",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "120%",
                  opacity: act.disabled ? 0.5 : 1,
                  transition: "background 0.15s ease",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!act.disabled) {
                    e.currentTarget.style.background = act.danger ? "rgba(220, 38, 38, 0.08)" : "#EFF6FF";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!act.disabled) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  {act.icon}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {act.label}
                </span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
