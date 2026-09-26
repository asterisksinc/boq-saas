"use client";

import React, { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { BrandAssetType } from "@/lib/settings/types";

interface BrandAssetUploaderProps {
    assetType: BrandAssetType;
    label: string;
    required?: boolean;
    currentUrl: string | null | undefined;
    isUploading: boolean;
    isDeleting: boolean;
    onUpload: (file: File, assetType: BrandAssetType) => Promise<void>;
    onDelete: (assetType: BrandAssetType) => Promise<void>;
    onError: (message: string) => void;
    helperText?: string;
    acceptedFormatsText?: string;
}

export default function BrandAssetUploader({
    assetType,
    label,
    required = true,
    currentUrl,
    isUploading,
    isDeleting,
    onUpload,
    onDelete,
    onError,
    acceptedFormatsText = "png, pdf, jpg, docx accepted",
}: BrandAssetUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const validateAndUpload = async (file: File) => {
        // Validate file size
        const maxBytes = assetType === "favicon" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
        const maxMb = maxBytes / (1024 * 1024);

        if (file.size > maxBytes) {
            onError(`File exceeds the ${maxMb}MB limit for this asset.`);
            return;
        }

        // Validate file extension and MIME
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const allowedExtensions = assetType === "favicon"
            ? ["ico", "png", "svg", "webp", "jpg", "jpeg"]
            : ["png", "jpg", "jpeg", "webp", "svg", "gif"];

        const isAllowedExtension = allowedExtensions.includes(ext);
        const isImageMime = file.type.startsWith("image/");

        if (!isAllowedExtension && !isImageMime) {
            onError(`Invalid file format. Please upload an image (${allowedExtensions.join(", ")}).`);
            return;
        }

        try {
            await onUpload(file, assetType);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to upload file. Please try again.";
            onError(message);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await validateAndUpload(file);
        }
        // Reset file input value so user can upload the same file again if desired
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            await validateAndUpload(file);
        }
    };

    const handleCardClick = () => {
        if (!isUploading && !isDeleting) {
            fileInputRef.current?.click();
        }
    };

    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isUploading || isDeleting) return;
        try {
            await onDelete(assetType);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to remove asset.";
            onError(message);
        }
    };

    const isBusy = isUploading || isDeleting;
    const hasConfiguredAsset = Boolean(currentUrl && currentUrl.trim().length > 0);

    return (
        <div className="brand-asset-card-wrapper">
            <div className="brand-asset-label-row">
                <span className="brand-asset-label">
                    {label}
                    {required && <span className="brand-asset-required">*</span>}
                </span>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                className="brand-asset-hidden-input"
                style={{ display: "none" }}
                onChange={handleFileChange}
                accept={assetType === "favicon" ? ".ico,.png,.svg,.webp,.jpg,.jpeg" : ".png,.jpg,.jpeg,.webp,.svg,.gif"}
                aria-label={`Upload ${label}`}
                disabled={isBusy}
            />

            <div
                className={`brand-asset-dropzone ${hasConfiguredAsset ? "is-configured" : "is-empty"} ${isDragOver ? "is-dragover" : ""} ${isBusy ? "is-busy" : ""}`}
                onClick={handleCardClick}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                aria-label={hasConfiguredAsset ? `${label} uploaded. Click to replace.` : `Click or drag and drop to upload ${label}`}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCardClick();
                    }
                }}
            >
                {isBusy ? (
                    <div className="brand-asset-loading">
                        <Loader2 className="spin brand-asset-spinner" size={28} />
                        <span className="brand-asset-loading-text">
                            {isUploading ? "Uploading asset..." : "Removing asset..."}
                        </span>
                    </div>
                ) : hasConfiguredAsset ? (
                    <div className="brand-asset-preview-container">
                        <button
                            type="button"
                            className="brand-asset-delete-btn"
                            onClick={handleDeleteClick}
                            title={`Remove ${label}`}
                            aria-label={`Remove ${label}`}
                        >
                            <X size={13} strokeWidth={2.5} />
                        </button>

                        <div className={`brand-asset-image-wrap ${assetType === "favicon" ? "is-favicon" : ""}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={currentUrl!}
                                alt={label}
                                className="brand-asset-preview-img"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="brand-asset-empty-content">
                        <div className="brand-asset-upload-icon-badge">
                            <Upload size={18} className="brand-asset-upload-icon" />
                        </div>
                        <span className="brand-asset-prompt-main">
                            select your file or drag and drop
                        </span>
                        <span className="brand-asset-prompt-sub">
                            {acceptedFormatsText}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
