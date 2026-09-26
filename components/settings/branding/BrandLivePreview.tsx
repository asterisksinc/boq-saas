"use client";

import { BrandingSettings } from "@/lib/settings/types";

interface BrandLivePreviewProps {
    branding: BrandingSettings;
    companyName?: string;
    projectName?: string;
}

export default function BrandLivePreview({
    branding,
    companyName,
    projectName = "Residence - Andheri West",
}: BrandLivePreviewProps) {
    const primaryColor = branding.colors?.primary || "#2563EB";
    const textColor = branding.colors?.text || "#0F172A";
    const displayName = companyName || branding.companyName || "Arvin Interiors";

    // Button style border-radius
    const buttonBorderRadius = (() => {
        switch (branding.buttonStyle) {
            case "square":
                return "0px";
            case "pill":
                return "9999px";
            case "rounded":
            default:
                return "6px";
        }
    })();

    // Spacing padding and gap
    const spacingStyles = (() => {
        switch (branding.documentSpacing) {
            case "spacious":
                return {
                    rowPadding: "12px 0",
                    tableGap: "16px",
                    cardPadding: "24px 20px",
                    itemGap: "12px",
                };
            case "standard":
                return {
                    rowPadding: "8px 0",
                    tableGap: "12px",
                    cardPadding: "20px 18px",
                    itemGap: "8px",
                };
            case "compact":
            default:
                return {
                    rowPadding: "5px 0",
                    tableGap: "8px",
                    cardPadding: "16px 16px",
                    itemGap: "6px",
                };
        }
    })();

    return (
        <aside className="brand-live-preview-wrap" aria-label="Brand Live Preview">
            <div className="brand-live-preview-title">LIVE PREVIEW</div>

            <div
                className="brand-live-preview-card"
                style={{
                    fontFamily: branding.font ? `"${branding.font}", sans-serif` : "inherit",
                    color: textColor,
                }}
            >
                {/* Header banner in Primary Color */}
                <div
                    className="brand-preview-banner"
                    style={{ backgroundColor: primaryColor }}
                >
                    <div className="brand-preview-banner-company">{displayName}</div>
                    <div className="brand-preview-banner-subtitle">BOQ Proposal</div>
                </div>

                {/* Body Content */}
                <div
                    className="brand-preview-body"
                    style={{ padding: spacingStyles.cardPadding }}
                >
                    <div className="brand-preview-project-header">
                        Project: {projectName}
                    </div>

                    <div className="brand-preview-table-header">
                        <span className="brand-preview-th-item">Item</span>
                        <span className="brand-preview-th-amount">Amount</span>
                    </div>

                    <div
                        className="brand-preview-items-list"
                        style={{ display: "flex", flexDirection: "column", gap: spacingStyles.itemGap }}
                    >
                        <div
                            className="brand-preview-item-row"
                            style={{ padding: spacingStyles.rowPadding }}
                        >
                            <span className="brand-preview-item-name">Living Room Furniture</span>
                            <span className="brand-preview-item-value">₹1,20,000</span>
                        </div>
                        <div
                            className="brand-preview-item-row"
                            style={{ padding: spacingStyles.rowPadding }}
                        >
                            <span className="brand-preview-item-name">Kitchen Cabinets</span>
                            <span className="brand-preview-item-value">₹1,20,000</span>
                        </div>
                        <div
                            className="brand-preview-item-row"
                            style={{ padding: spacingStyles.rowPadding }}
                        >
                            <span className="brand-preview-item-name">Electrical Works</span>
                            <span className="brand-preview-item-value">₹1,20,000</span>
                        </div>
                    </div>

                    <div className="brand-preview-divider" />

                    <div className="brand-preview-total-row">
                        <span className="brand-preview-total-label">Total</span>
                        <span className="brand-preview-total-value">₹3,60,000</span>
                    </div>

                    <button
                        type="button"
                        className="brand-preview-action-btn"
                        style={{
                            backgroundColor: primaryColor,
                            borderRadius: buttonBorderRadius,
                        }}
                    >
                        Approve Proposal
                    </button>
                </div>
            </div>
        </aside>
    );
}
