"use client";

import { useEffect, useState } from "react";
import DocumentPreviewTabs from "./DocumentPreviewTabs";
import DocumentPreviewCanvas from "./DocumentPreviewCanvas";
import { BrandingSettings, BrandingPreviewData, DocumentPreviewType } from "@/lib/settings/types";
import { getBrandingPreviewData } from "@/lib/api/auth";

interface DocumentPreviewPanelProps {
    branding: BrandingSettings;
    companyName?: string;
    showNotice: (message: string, type?: "success" | "error") => void;
}

export default function DocumentPreviewPanel({
    branding,
    companyName,
}: DocumentPreviewPanelProps) {
    const [activeTab, setActiveTab] = useState<DocumentPreviewType>("boq");
    const [viewMode, setViewMode] = useState<"reference" | "detailed">("reference");
    const [previewData, setPreviewData] = useState<BrandingPreviewData | null>(null);

    useEffect(() => {
        let mounted = true;
        getBrandingPreviewData()
            .then((data) => {
                if (mounted && data) {
                    setPreviewData(data);
                }
            })
            .catch(() => {
                // Keep default preview data
            });

        return () => {
            mounted = false;
        };
    }, []);

    const effectiveData: BrandingPreviewData = previewData || {
        organization: {
            name: companyName || branding.companyName || "Arvin Interiors",
            address: "204, Bhulabhai Desai Rd, Mumbai 400026",
            phone: "+91 98200 00001",
            email: "contact@arvininteriors.com",
        },
        boq: {
            number: "BOQ-2026-014",
            title: "Residence - Andheri West",
            amount: 360000,
            items: [
                { name: "Living Room Furniture", amount: 120000 },
                { name: "Kitchen Cabinets", amount: 120000 },
                { name: "Electrical Works", amount: 120000 },
            ],
        },
        proposal: {
            number: "BOQ-2026-014",
            projectName: "Residence - Andheri West",
            amount: 360000,
            items: [
                { name: "Living Room Furniture", amount: 120000 },
                { name: "Kitchen Cabinets", amount: 120000 },
                { name: "Electrical Works", amount: 120000 },
            ],
        },
        invoice: {
            number: "BOQ-2026-014",
            projectName: "Residence - Andheri West",
            amount: 360000,
            items: [
                { name: "Living Room Furniture", amount: 120000 },
                { name: "Kitchen Cabinets", amount: 120000 },
                { name: "Electrical Works", amount: 120000 },
            ],
        },
        email: {
            subject: `Document Update from ${companyName || "Arvin Interiors"}`,
            greeting: "Dear Client,",
            body: `Please review the latest project details and quotation from ${companyName || "Arvin Interiors"}.`,
            ctaText: "Review & Approve Document",
        },
    };

    return (
        <div className="doc-preview-panel">
            {/* Top horizontal tabs */}
            <DocumentPreviewTabs
                activeTab={activeTab}
                onSelectTab={setActiveTab}
            />

            {/* Document sheet */}
            <DocumentPreviewCanvas
                type={activeTab}
                branding={branding}
                previewData={effectiveData}
                viewMode={viewMode}
                onToggleViewMode={() =>
                    setViewMode((prev) => (prev === "reference" ? "detailed" : "reference"))
                }
            />
        </div>
    );
}
