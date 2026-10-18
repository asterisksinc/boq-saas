"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { updateCostingItem } from "@/lib/api/costing";

export type RateStatus = "active" | "draft" | "expired" | "inactive" | "approved" | "pending";

interface RateStatusDropdownProps {
  itemId?: string;
  status?: string | null | undefined;
  currentStatus?: string | null | undefined;
  editable?: boolean;
  onStatusChange?: (newStatus: string) => void;
  allowedStatuses?: Array<{ label: string; value: string }>;
  size?: "sm" | "md";
}

const DEFAULT_STATUSES: Array<{ label: string; value: string }> = [
  { label: "Approved", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Expired", value: "expired" },
];

export default function RateStatusDropdown({
  itemId,
  status,
  currentStatus: propStatus,
  editable = true,
  onStatusChange,
  allowedStatuses = DEFAULT_STATUSES,
}: RateStatusDropdownProps) {
  const effectivePropStatus = status ?? propStatus;
  const [currentStatus, setCurrentStatus] = useState<string>(
    (effectivePropStatus || "draft").toLowerCase()
  );
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (effectivePropStatus) {
      setCurrentStatus(effectivePropStatus.toLowerCase());
    }
  }, [effectivePropStatus]);

  const updateMenuPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 140;
      let left = rect.left;
      if (left + menuWidth > window.innerWidth - 12) {
        left = window.innerWidth - menuWidth - 12;
      }
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        left: Math.max(12, left),
      });
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editable || loading) return;
    if (!isOpen) {
      updateMenuPosition();
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

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const handleSelectStatus = async (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (val === currentStatus) {
      setIsOpen(false);
      return;
    }

    const prev = currentStatus;
    setCurrentStatus(val);
    setIsOpen(false);

    if (onStatusChange) {
      onStatusChange(val);
    }

    if (itemId) {
      setLoading(true);
      try {
        await updateCostingItem(itemId, { rateStatus: val });
      } catch (err) {
        console.error("Failed to update rate status:", err);
        setCurrentStatus(prev); // Revert on failure
        if (onStatusChange) {
          onStatusChange(prev);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusStyle = (s: string) => {
    const norm = s.toLowerCase();
    switch (norm) {
      case "active":
      case "approved":
        return {
          bg: "rgba(22, 163, 74, 0.12)",
          color: "#16A34A",
          label: "APPROVED",
        };
      case "draft":
      case "pending":
        return {
          bg: "rgba(100, 116, 139, 0.12)",
          color: "#64748B",
          label: "DRAFT",
        };
      case "expired":
      case "inactive":
        return {
          bg: "rgba(220, 38, 38, 0.12)",
          color: "#DC2626",
          label: "EXPIRED",
        };
      default:
        return {
          bg: "rgba(100, 116, 139, 0.12)",
          color: "#64748B",
          label: norm.toUpperCase(),
        };
    }
  };

  const style = getStatusStyle(currentStatus);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={!editable || loading}
        style={{
          display: "inline-flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          padding: "2px 6px",
          gap: "4px",
          height: "18px",
          background: style.bg,
          color: style.color,
          border: "none",
          borderRadius: "9999px",
          fontFamily: "'Urbanist', sans-serif",
          fontStyle: "normal",
          fontWeight: 500,
          fontSize: "12px",
          lineHeight: "120%",
          cursor: editable && !loading ? "pointer" : "default",
          transition: "all 0.15s ease",
          outline: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
        title={editable ? "Click to change rate status" : undefined}
      >
        {loading ? (
          <Loader2 size={11} className="animate-spin" />
        ) : null}
        <span>{style.label}</span>
        {editable && <ChevronDown size={11} color={style.color} style={{ opacity: 0.8 }} />}
      </button>

      {isOpen &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              zIndex: 99999,
              background: "#ffffff",
              border: "1px solid #EBEBEB",
              borderRadius: "10px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
              padding: "4px",
              minWidth: "130px",
              animation: "fadeIn 0.1s ease-out",
            }}
          >
            {allowedStatuses.map((opt) => {
              const isSelected = opt.value.toLowerCase() === currentStatus.toLowerCase();
              const optStyle = getStatusStyle(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => handleSelectStatus(opt.value, e)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    padding: "6px 8px",
                    background: isSelected ? "#F1F5F9" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontFamily: "'Urbanist', sans-serif",
                    color: "#0F172A",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#F8FAFC";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        padding: "1px 6px",
                        borderRadius: "9999px",
                        background: optStyle.bg,
                        color: optStyle.color,
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    >
                      {optStyle.label}
                    </span>
                  </span>
                  {isSelected && <Check size={13} color="#2563EB" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
