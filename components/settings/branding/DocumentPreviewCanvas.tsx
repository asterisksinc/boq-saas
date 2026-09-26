"use client";

import { Eye, Layers } from "lucide-react";
import { BrandingSettings, BrandingPreviewData, DocumentPreviewType } from "@/lib/settings/types";

interface DocumentPreviewCanvasProps {
    type: DocumentPreviewType;
    branding: BrandingSettings;
    previewData: BrandingPreviewData | null;
    viewMode: "reference" | "detailed";
    onToggleViewMode: () => void;
}

export default function DocumentPreviewCanvas({
    type,
    branding,
    previewData,
    viewMode,
    onToggleViewMode,
}: DocumentPreviewCanvasProps) {
    const orgName = previewData?.organization?.name || branding.companyName || "Arvin Interiors";
    const orgAddress = previewData?.organization?.address || "204, Bhulabhai Desai Rd, Mumbai 400026";
    const primaryColor = branding.colors?.primary || "#2563EB";
    const textColor = branding.colors?.text || "#0F172A";

    const docTypeLabel = (() => {
        switch (type) {
            case "boq":
                return "BOQ PDF";
            case "proposal":
                return "Proposal";
            case "invoice":
                return "Invoice";
            case "email":
                return "Email";
        }
    })();

    const docIdentifier = (() => {
        switch (type) {
            case "boq":
                return previewData?.boq?.number || "BOQ-2026-014";
            case "proposal":
                return previewData?.proposal?.number || "BOQ-2026-014";
            case "invoice":
                return previewData?.invoice?.number || "BOQ-2026-014";
            case "email":
                return "Delivery & Alert";
        }
    })();

    // Spacing padding & gaps for detailed view
    const spacingStyles = (() => {
        switch (branding.documentSpacing) {
            case "spacious":
                return { rowPadding: "14px 16px", tableGap: "16px", sectionGap: "24px" };
            case "standard":
                return { rowPadding: "10px 14px", tableGap: "12px", sectionGap: "18px" };
            case "compact":
            default:
                return { rowPadding: "7px 12px", tableGap: "8px", sectionGap: "14px" };
        }
    })();

    // Button style border radius
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

    return (
        <div className="doc-preview-canvas-container">
            {/* View Mode Toggle Controls */}
            <div className="doc-preview-toolbar">
                <button
                    type="button"
                    className="doc-preview-toggle-btn"
                    onClick={onToggleViewMode}
                    title="Toggle between Reference Layout (Screenshots) and Live Rendered Document"
                >
                    {viewMode === "reference" ? (
                        <>
                            <Eye size={14} />
                            <span>Switch to Detailed Document View</span>
                        </>
                    ) : (
                        <>
                            <Layers size={14} />
                            <span>Switch to Reference Design View</span>
                        </>
                    )}
                </button>
            </div>

            {/* Paper Sheet Preview */}
            <article
                className="doc-preview-sheet"
                style={{
                    fontFamily: branding.font ? `"${branding.font}", sans-serif` : "inherit",
                    color: textColor,
                }}
            >
                {/* Document Header */}
                <header className="doc-preview-header">
                    <div className="doc-header-left">
                        {branding.primaryLogo ? (
                            <div className="doc-header-logo-wrap">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={branding.primaryLogo}
                                    alt={`${orgName} logo`}
                                    className="doc-header-logo-img"
                                />
                            </div>
                        ) : null}
                        <h2 className="doc-company-name">{orgName}</h2>
                        <p className="doc-company-address">{orgAddress}</p>
                    </div>

                    <div className="doc-header-right">
                        <span className="doc-type-title" style={{ color: primaryColor }}>
                            {docTypeLabel}
                        </span>
                        <span className="doc-identifier">{docIdentifier}</span>
                    </div>
                </header>

                <div className="doc-header-divider" />

                {/* Document Body Content */}
                {viewMode === "reference" ? (
                    // Exact visual match with Screenshots 3, 4, 5: 6 rounded placeholder bars
                    <div className="doc-skeleton-content" aria-label="Reference layout preview">
                        <div className="doc-skeleton-bar" style={{ width: "100%", height: "26px" }} />
                        <div className="doc-skeleton-bar" style={{ width: "90%", height: "24px" }} />
                        <div className="doc-skeleton-bar" style={{ width: "92%", height: "24px" }} />
                        <div className="doc-skeleton-bar" style={{ width: "62%", height: "24px" }} />
                        <div className="doc-skeleton-bar" style={{ width: "78%", height: "24px" }} />
                        <div className="doc-skeleton-bar" style={{ width: "90%", height: "24px" }} />
                    </div>
                ) : type === "email" ? (
                    // Detailed Email Preview
                    <div className="doc-email-detailed-body" style={{ gap: spacingStyles.sectionGap }}>
                        <div className="doc-email-meta-box">
                            <div><strong>Subject:</strong> {previewData?.email?.subject || `Update from ${orgName}`}</div>
                            <div><strong>From:</strong> {orgName} &lt;{previewData?.organization?.email || "notifications@boq.com"}&gt;</div>
                        </div>

                        <div className="doc-email-message-card">
                            <p className="doc-email-greeting">{previewData?.email?.greeting || "Dear Client,"}</p>
                            <p className="doc-email-body-text">
                                {previewData?.email?.body ||
                                    `Please review the latest project details and quotation issued by ${orgName}. Click below to view the full document.`}
                            </p>

                            <div className="doc-email-action-row">
                                <button
                                    type="button"
                                    className="doc-email-cta-btn"
                                    style={{
                                        backgroundColor: primaryColor,
                                        borderRadius: buttonBorderRadius,
                                    }}
                                >
                                    {previewData?.email?.ctaText || "Review Document"}
                                </button>
                            </div>

                            {branding.signature && (
                                <div className="doc-email-signature-wrap">
                                    <div className="doc-email-sig-label">Authorized Signatory:</div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={branding.signature}
                                        alt="Authorized signature"
                                        className="doc-email-signature-img"
                                    />
                                </div>
                            )}

                            <footer className="doc-email-footer">
                                <div>{orgName} • {orgAddress}</div>
                                {previewData?.organization?.phone && <div>Tel: {previewData.organization.phone}</div>}
                            </footer>
                        </div>
                    </div>
                ) : (
                    // Detailed BOQ / Proposal / Invoice Document View
                    <div className="doc-detailed-content" style={{ gap: spacingStyles.sectionGap }}>
                        <div className="doc-detailed-meta-row">
                            <div>
                                <span className="doc-meta-label">Project:</span>{" "}
                                <strong className="doc-meta-value">
                                    {type === "boq"
                                        ? previewData?.boq?.title
                                        : type === "proposal"
                                        ? previewData?.proposal?.projectName
                                        : previewData?.invoice?.projectName || "Residence - Andheri West"}
                                </strong>
                            </div>
                            <div>
                                <span className="doc-meta-label">Total Amount:</span>{" "}
                                <strong className="doc-meta-value" style={{ color: primaryColor }}>
                                    ₹3,60,000
                                </strong>
                            </div>
                        </div>

                        <div className="doc-detailed-table-container">
                            <table className="doc-detailed-table">
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${primaryColor}22` }}>
                                        <th className="doc-th" style={{ color: primaryColor }}>Item Description</th>
                                        <th className="doc-th doc-th-qty">Qty</th>
                                        <th className="doc-th doc-th-amount">Amount (INR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ padding: spacingStyles.rowPadding }}>
                                        <td className="doc-td">Living Room Furniture (Sofa set, Coffee table, TV Console)</td>
                                        <td className="doc-td doc-th-qty">1 Set</td>
                                        <td className="doc-td doc-th-amount">₹1,20,000</td>
                                    </tr>
                                    <tr style={{ padding: spacingStyles.rowPadding }}>
                                        <td className="doc-td">Modular Kitchen Cabinets & Quartz Countertops</td>
                                        <td className="doc-td doc-th-qty">1 Lot</td>
                                        <td className="doc-td doc-th-amount">₹1,20,000</td>
                                    </tr>
                                    <tr style={{ padding: spacingStyles.rowPadding }}>
                                        <td className="doc-td">Concealed Wiring, Switchboards & Premium LED Fixtures</td>
                                        <td className="doc-td doc-th-qty">1 Lot</td>
                                        <td className="doc-td doc-th-amount">₹1,20,000</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={2} className="doc-td-total-label">Subtotal</td>
                                        <td className="doc-td-total-amount">₹3,60,000</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} className="doc-td-total-label">Tax (18% GST Included)</td>
                                        <td className="doc-td-total-amount">₹54,915</td>
                                    </tr>
                                    <tr className="doc-grand-total-row" style={{ borderTop: `2px solid ${primaryColor}` }}>
                                        <td colSpan={2} className="doc-grand-total-label">Grand Total</td>
                                        <td className="doc-grand-total-amount" style={{ color: primaryColor }}>
                                            ₹3,60,000
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Signatures & Approval */}
                        <div className="doc-footer-signatures">
                            {branding.signature ? (
                                <div className="doc-signature-block">
                                    <span className="doc-sig-caption">Authorized Representative</span>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={branding.signature}
                                        alt="Signature"
                                        className="doc-signature-img"
                                    />
                                    <span className="doc-sig-org">{orgName}</span>
                                </div>
                            ) : null}

                            <div className="doc-action-block">
                                <button
                                    type="button"
                                    className="doc-primary-action-btn"
                                    style={{
                                        backgroundColor: primaryColor,
                                        borderRadius: buttonBorderRadius,
                                    }}
                                >
                                    {type === "invoice" ? "Pay Invoice" : "Accept & Proceed"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </article>
        </div>
    );
}
