"use client";

import React from "react";

/**
 * Figma empty state illustration (Frame 2147225421), exported from the design file: pale-blue circle with a document,
 * blue "+" badge, clouds, sparkles and dots. Shared by every "No … found" empty state.
 */
export const EMPTY_ILLUSTRATION_SRC = "/assets/empty-state/empty-illustration.png";

export default function BoqEmptyIllustration() {
    return (
        <div className="boq-empty-illustration-wrap" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={EMPTY_ILLUSTRATION_SRC} alt="" width={411} height={196} style={{ width: "100%", height: "auto", maxHeight: "196px", objectFit: "contain" }} />
        </div>
    );
}
