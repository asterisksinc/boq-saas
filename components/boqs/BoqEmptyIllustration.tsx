"use client";

import React from "react";

/**
 * Recreates the Figma Empty State illustration (Frame 2147225421)
 * Pale-blue circular background, central BOQ document/list, floating blue badge with white plus,
 * subtle low-opacity blue accent pills, sparkle stars and dots.
 */
export default function BoqEmptyIllustration() {
    return (
        <div className="boq-empty-illustration-wrap" aria-hidden="true">
            <svg
                width="411"
                height="196"
                viewBox="0 0 411 196"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: "100%", height: "auto", maxHeight: "196px" }}
            >
                {/* Large pale blue circle background (Ellipse 41: 164x164 at opacity 0.07) */}
                <circle cx="211" cy="98" r="82" fill="#2563EB" fillOpacity="0.07" />

                {/* Left accent floating pill (Union: 75x34 at opacity 0.08) */}
                <rect x="10" y="63" width="75" height="34" rx="17" fill="#2563EB" fillOpacity="0.08" />

                {/* Right accent floating pill (Union: 81x36 at opacity 0.08) */}
                <rect x="320" y="131" width="81" height="36" rx="18" fill="#2563EB" fillOpacity="0.08" />

                {/* Decorative Sparkle Star 2 (left: 14x14 at opacity 0.15) */}
                <path
                    d="M98 39L99.8 44.2L105 46L99.8 47.8L98 53L96.2 47.8L91 46L96.2 44.2L98 39Z"
                    fill="#2563EB"
                    fillOpacity="0.15"
                />

                {/* Decorative Sparkle Star 1 (right: 14x14 at opacity 0.15) */}
                <path
                    d="M327 44L328.8 49.2L334 51L328.8 52.8L327 58L325.2 52.8L320 51L325.2 49.2L327 44Z"
                    fill="#2563EB"
                    fillOpacity="0.15"
                />

                {/* Accent dots (Ellipse 42, 43 at opacity 0.15) */}
                <circle cx="15.5" cy="10.5" r="3.5" fill="#2563EB" fillOpacity="0.15" />
                <circle cx="102.5" cy="157.5" r="3.5" fill="#2563EB" fillOpacity="0.15" />
                <circle cx="341.5" cy="97.5" r="2.5" fill="#2563EB" fillOpacity="0.15" />

                {/* Central BOQ Document / Clipboard Illustration (94x94 area, opacity 0.16) */}
                <g transform="translate(164, 51)">
                    <rect x="12" y="8" width="70" height="78" rx="8" fill="#2563EB" fillOpacity="0.16" />
                    <rect x="22" y="24" width="38" height="4" rx="2" fill="#2563EB" fillOpacity="0.30" />
                    <rect x="22" y="34" width="50" height="4" rx="2" fill="#2563EB" fillOpacity="0.22" />
                    <rect x="22" y="44" width="46" height="4" rx="2" fill="#2563EB" fillOpacity="0.22" />
                    <rect x="22" y="54" width="34" height="4" rx="2" fill="#2563EB" fillOpacity="0.22" />
                    <rect x="22" y="64" width="42" height="4" rx="2" fill="#2563EB" fillOpacity="0.22" />
                    {/* Document Header Clip */}
                    <rect x="34" y="4" width="26" height="8" rx="4" fill="#2563EB" fillOpacity="0.35" />
                </g>

                {/* Floating primary blue circular action badge (Frame 2147225419: 32.27x32.27 with white plus) */}
                <g transform="translate(225, 110)">
                    <circle cx="16" cy="16" r="16" fill="#2563EB" />
                    <path
                        d="M16 10V22M10 16H22"
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>
            </svg>
        </div>
    );
}
