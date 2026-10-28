"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type ClientAuthLayoutProps = {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    children: ReactNode;
    icon?: ReactNode;
    hideDefaultHeader?: boolean;
    hideFooter?: boolean;
};

export function ClientAuthLayout({
    eyebrow,
    title,
    subtitle,
    children,
    icon,
    hideDefaultHeader = false,
    hideFooter = false,
}: ClientAuthLayoutProps) {
    return (
        <main className="client-auth-shell">
            {/* Left Branding Panel (Figma Frame 2) */}
            <aside className="client-branding-panel" aria-label="BOQ Platform Highlights">
                {/* Decorative Layered Blurred Ellipses (Figma Ellipse 3, 2, 1) */}
                <div className="client-branding-glows" aria-hidden="true">
                    <div className="client-glow-ellipse-3" />
                    <div className="client-glow-ellipse-2" />
                    <div className="client-glow-ellipse-1" />
                </div>

                {/* Branding Content Box (Figma Frame 17) */}
                <div className="client-branding-content">
                    {/* Logo Tile (Figma Frame 16) */}
                    <div className="client-branding-logo-box" aria-label="BOQ SaaS Logo">
                        <img src="/assets/boq-logo-large.svg" alt="BOQ Logo" width={92} height={92} />
                    </div>

                    {/* Text Container (Figma Frame 18) */}
                    <h1 className="client-branding-title">One Platform for Every Commercial Decision</h1>
                    <p className="client-branding-copy">
                        Create accurate BOQs, standardize costing, compare vendors, manage approvals,
                        and move projects from estimation to procurement—all in one connected workspace.
                    </p>

                    {/* Carousel Indicators (Figma Frame 20) */}
                    <div className="client-branding-dots" aria-hidden="true">
                        <span className="active" />
                        <span />
                        <span />
                    </div>
                </div>
            </aside>

            {/* Right White Content Panel (Figma Frame 9) */}
            <section className="client-content-panel">
                <div className="client-panel-inner">
                    {!hideDefaultHeader && (
                        <>
                            {icon ? (
                                icon
                            ) : title ? (
                                <div className="client-mini-logo" aria-label="BOQ Logo">
                                    <img src="/assets/boq-logo-small.svg" alt="BOQ" width={32} height={32} />
                                </div>
                            ) : null}

                            {eyebrow && <div className="client-eyebrow">{eyebrow}</div>}
                            {title && <h2 className="client-title">{title}</h2>}
                            {subtitle && <p className="client-subtitle">{subtitle}</p>}
                        </>
                    )}

                    {children}
                </div>

                {!hideFooter && (
                    <div className="client-footer-wrap">
                        <div className="client-divider" />
                        <footer className="client-footer">
                            <span className="client-footer-copy">2026 BOQ. All Rights Reserved.</span>
                            <div className="client-footer-links">
                                <Link href="/privacy-policy">Privacy Policy</Link>
                                <Link href="/terms-of-service">Terms of Service</Link>
                            </div>
                        </footer>
                    </div>
                )}
            </section>
        </main>
    );
}
