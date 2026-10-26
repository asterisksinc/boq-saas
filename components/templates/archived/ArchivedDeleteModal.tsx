"use client";

import React from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface ArchivedDeleteModalProps {
  isOpen: boolean;
  templateName: string;
  templateType: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ArchivedDeleteModal({
  isOpen,
  templateName,
  templateType,
  isDeleting,
  onClose,
  onConfirm,
}: ArchivedDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="archived-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="archived-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="archived-modal-header">
          <div className="archived-modal-icon-badge danger">
            <AlertTriangle size={20} />
          </div>
          <div className="archived-modal-title-group">
            <h3 className="archived-modal-title">Delete Template Permanently</h3>
            <p className="archived-modal-subtitle">
              This action is permanent and cannot be reversed.
            </p>
          </div>
          <button
            type="button"
            className="archived-modal-close-btn"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="archived-modal-body">
          <p className="archived-modal-text">
            Are you sure you want to permanently delete the {templateType.toLowerCase()}{" "}
            <strong>&quot;{templateName}&quot;</strong>?
          </p>
          <div className="archived-modal-warning-box">
            <p>
              Once deleted, all historical data and versions associated with this archived template will be removed permanently from your workspace.
            </p>
          </div>
        </div>

        <div className="archived-modal-footer">
          <button
            type="button"
            className="archived-modal-btn-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="archived-modal-btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="archived-spin" />
                <span>Deleting…</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
