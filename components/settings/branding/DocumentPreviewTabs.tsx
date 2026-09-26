"use client";

import { DocumentPreviewType } from "@/lib/settings/types";

interface DocumentPreviewTabsProps {
    activeTab: DocumentPreviewType;
    onSelectTab: (tab: DocumentPreviewType) => void;
}

const previewTabs: Array<{ key: DocumentPreviewType; label: string }> = [
    { key: "boq", label: "BOQ PDF" },
    { key: "proposal", label: "Proposal" },
    { key: "invoice", label: "Invoice" },
    { key: "email", label: "Email" },
];

export default function DocumentPreviewTabs({
    activeTab,
    onSelectTab,
}: DocumentPreviewTabsProps) {
    return (
        <div className="doc-preview-tabs-bar" role="tablist" aria-label="Document Preview Tabs">
            {previewTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`doc-preview-tab-btn ${isActive ? "is-active" : ""}`}
                        onClick={() => onSelectTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
