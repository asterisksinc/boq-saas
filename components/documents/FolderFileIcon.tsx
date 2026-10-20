"use client";

import React from "react";
import {
    File,
    FileArchive,
    FileCode,
    FileImage,
    FileSpreadsheet,
    FileText,
} from "lucide-react";

interface FolderFileIconProps {
    type?: "folder" | "file";
    fileName?: string;
    mimeType?: string;
    className?: string;
}

export function FolderFileIcon({
    type = "folder",
    fileName,
    mimeType,
    className = "",
}: FolderFileIconProps) {
    if (type === "folder") {
        return (
            <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`doc-icon-svg ${className}`}
                aria-hidden="true"
            >
                <rect width="40" height="40" rx="20" fill="#E4ECFB" />
                <path
                    d="M12.5 27.5C12.0397 27.5 11.6666 27.1269 11.6666 26.6667V13.3333C11.6666 12.8731 12.0397 12.5 12.5 12.5H18.6785L20.3451 14.1667H26.6666C27.1269 14.1667 27.5 14.5398 27.5 15V17.5H25.8333V15.8333H19.6548L17.9881 14.1667H13.3333V24.165L14.5833 19.1667H28.75L26.8245 26.8687C26.7317 27.2397 26.3984 27.5 26.016 27.5H12.5ZM26.6153 20.8333H15.8846L14.6346 25.8333H25.3653L26.6153 20.8333Z"
                    fill="#2563EB"
                />
            </svg>
        );
    }

    // Determine file type from extension and/or mimeType
    const ext = fileName ? fileName.split(".").pop()?.toLowerCase() || "" : "";
    const mime = (mimeType || "").toLowerCase();

    if (ext === "pdf" || mime.includes("pdf")) {
        return (
            <div className={`doc-icon-circle pdf ${className}`} aria-hidden="true">
                <FileText size={20} />
            </div>
        );
    }

    if (
        ["xls", "xlsx", "csv"].includes(ext) ||
        mime.includes("sheet") ||
        mime.includes("excel") ||
        mime.includes("csv")
    ) {
        return (
            <div className={`doc-icon-circle excel ${className}`} aria-hidden="true">
                <FileSpreadsheet size={20} />
            </div>
        );
    }

    if (
        ["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext) ||
        mime.startsWith("image/")
    ) {
        return (
            <div className={`doc-icon-circle image ${className}`} aria-hidden="true">
                <FileImage size={20} />
            </div>
        );
    }

    if (["zip", "rar", "tar", "gz", "7z"].includes(ext) || mime.includes("zip")) {
        return (
            <div className={`doc-icon-circle zip ${className}`} aria-hidden="true">
                <FileArchive size={20} />
            </div>
        );
    }

    if (["dwg", "dxf"].includes(ext)) {
        return (
            <div className={`doc-icon-circle cad ${className}`} aria-hidden="true">
                <FileCode size={20} />
            </div>
        );
    }

    if (["doc", "docx", "txt", "rtf"].includes(ext)) {
        return (
            <div className={`doc-icon-circle doc ${className}`} aria-hidden="true">
                <FileText size={20} />
            </div>
        );
    }

    return (
        <div className={`doc-icon-circle file ${className}`} aria-hidden="true">
            <File size={20} />
        </div>
    );
}
