"use client";

import { useState } from "react";
import BrandAssetUploader from "./BrandAssetUploader";
import { BrandAssetType, BrandingSettings } from "@/lib/settings/types";
import { uploadBrandingAsset, deleteBrandingAsset } from "@/lib/api/auth";

interface BrandAssetsPanelProps {
    branding: BrandingSettings;
    onBrandingUpdated: (updated: BrandingSettings) => void;
    showNotice: (message: string, type?: "success" | "error") => void;
}

export default function BrandAssetsPanel({
    branding,
    onBrandingUpdated,
    showNotice,
}: BrandAssetsPanelProps) {
    const [uploadingType, setUploadingType] = useState<BrandAssetType | null>(null);
    const [deletingType, setDeletingType] = useState<BrandAssetType | null>(null);

    const handleUpload = async (file: File, assetType: BrandAssetType) => {
        setUploadingType(assetType);
        try {
            const res = await uploadBrandingAsset(file, assetType);
            onBrandingUpdated(res.branding);
            showNotice(`${getAssetLabel(assetType)} updated successfully.`, "success");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to upload asset.";
            showNotice(msg, "error");
            throw err;
        } finally {
            setUploadingType(null);
        }
    };

    const handleDelete = async (assetType: BrandAssetType) => {
        setDeletingType(assetType);
        try {
            const res = await deleteBrandingAsset(assetType);
            onBrandingUpdated(res.branding);
            showNotice(`${getAssetLabel(assetType)} removed.`, "success");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to remove asset.";
            showNotice(msg, "error");
            throw err;
        } finally {
            setDeletingType(null);
        }
    };

    return (
        <div className="brand-assets-panel">
            <div className="brand-assets-grid">
                {/* 1. Primary Logo */}
                <BrandAssetUploader
                    assetType="primaryLogo"
                    label="Primary Logo"
                    required
                    currentUrl={branding.primaryLogo || branding.logoUrl}
                    isUploading={uploadingType === "primaryLogo"}
                    isDeleting={deletingType === "primaryLogo"}
                    onUpload={handleUpload}
                    onDelete={handleDelete}
                    onError={(msg) => showNotice(msg, "error")}
                />

                {/* 2. Light Logo */}
                <BrandAssetUploader
                    assetType="lightLogo"
                    label="Light Logo"
                    required
                    currentUrl={branding.lightLogo}
                    isUploading={uploadingType === "lightLogo"}
                    isDeleting={deletingType === "lightLogo"}
                    onUpload={handleUpload}
                    onDelete={handleDelete}
                    onError={(msg) => showNotice(msg, "error")}
                />

                {/* 3. Dark Logo */}
                <BrandAssetUploader
                    assetType="darkLogo"
                    label="Dark Logo"
                    required
                    currentUrl={branding.darkLogo}
                    isUploading={uploadingType === "darkLogo"}
                    isDeleting={deletingType === "darkLogo"}
                    onUpload={handleUpload}
                    onDelete={handleDelete}
                    onError={(msg) => showNotice(msg, "error")}
                />

                {/* 4. Favicon */}
                <BrandAssetUploader
                    assetType="favicon"
                    label="Favicon"
                    required
                    currentUrl={branding.favicon || branding.faviconUrl}
                    isUploading={uploadingType === "favicon"}
                    isDeleting={deletingType === "favicon"}
                    onUpload={handleUpload}
                    onDelete={handleDelete}
                    onError={(msg) => showNotice(msg, "error")}
                />

                {/* 5. Signature */}
                <BrandAssetUploader
                    assetType="signature"
                    label="Signature"
                    required
                    currentUrl={branding.signature}
                    isUploading={uploadingType === "signature"}
                    isDeleting={deletingType === "signature"}
                    onUpload={handleUpload}
                    onDelete={handleDelete}
                    onError={(msg) => showNotice(msg, "error")}
                />
            </div>
        </div>
    );
}

function getAssetLabel(assetType: BrandAssetType): string {
    switch (assetType) {
        case "primaryLogo":
            return "Primary logo";
        case "lightLogo":
            return "Light logo";
        case "darkLogo":
            return "Dark logo";
        case "favicon":
            return "Favicon";
        case "signature":
            return "Signature";
        default:
            return "Asset";
    }
}
