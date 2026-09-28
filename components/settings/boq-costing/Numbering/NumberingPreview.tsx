"use client";

import { useMemo } from "react";
import { BoqNumberingSettings } from "@/lib/settings/types";
import { generateNumberingPreview } from "@/lib/settings/adapter";

interface NumberingPreviewProps {
    settings: BoqNumberingSettings;
}

export default function NumberingPreview({ settings }: NumberingPreviewProps) {
    const previewString = useMemo(() => {
        return generateNumberingPreview(settings);
    }, [settings]);

    return (
        <div className="boq-live-preview-container" aria-label="Live numbering preview">
            <span className="boq-live-preview-label">LIVE PREVIEW</span>
            <span className="boq-live-preview-value" aria-live="polite">{previewString}</span>
        </div>
    );
}
