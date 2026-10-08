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
  { label: "Active", value: "active" },
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
  size = "sm",
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
          bg: "#ecfdf5",
          color: "#059669",
          border: "#a7f3d0",
          dot: "#10b981",
        };
      case "draft":
      case "pending":
        return {
          bg: "#f8fafc",
          color: "#475569",
          border: "#e2e8f0",
          dot: "#94a3b8",
        };
      case "expired":
      case "inactive":
        return {
          bg: "#fef2f2",
          color: "#dc2626",
          border: "#fecaca",
          dot: "#ef4444",
        };
      default:
        return {
          bg: "#f1f5f9",
          color: "#334155",
          border: "#cbd5e1",
          dot: "#64748b",
        };
    }
  };

  const style = getStatusStyle(currentStatus);
  const currentLabel =
    allowedStatuses.find((x) => x.value.toLowerCase() === currentStatus.toLowerCase())?.label ||
    currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={!editable || loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
          padding: size === "sm" ? "3px 8px" : "5px 12px",
          borderRadius: "16px",
          fontSize: size === "sm" ? "12px" : "13px",
          fontWeight: 600,
          cursor: editable && !loading ? "pointer" : "default",
          transition: "all 0.15s ease",
          outline: "none",
          userSelect: "none",
        }}
        title={editable ? "Click to change rate status" : undefined}
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: style.dot,
              display: "inline-block",
            }}
          />
        )}
        <span>{currentLabel}</span>
        {editable && <ChevronDown size={12} style={{ opacity: 0.7 }} />}
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
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
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
                    padding: "7px 10px",
                    background: isSelected ? "#f1f5f9" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12.5px",
                    color: "#1e293b",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: optStyle.dot,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontWeight: isSelected ? 600 : 500 }}>{opt.label}</span>
                  </span>
                  {isSelected && <Check size={14} color="#2563eb" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
