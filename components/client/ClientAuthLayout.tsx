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
};

export function ClientAuthLayout({
    eyebrow,
    title,
    subtitle,
    children,
    icon,
    hideDefaultHeader = false,
}: ClientAuthLayoutProps) {
    return (
        <main className="client-auth-shell">
            {/* Left Branding Panel */}
            <aside className="client-branding-panel" aria-label="BOQ Platform Highlights">
                <div className="client-branding-logo-box" aria-label="BOQ SaaS Logo">
                    <img src="/assets/boq-logo-large.svg" alt="BOQ Logo" />
                </div>
                <h1 className="client-branding-title">One Platform for Every Commercial Decision</h1>
                <p className="client-branding-copy">
                    Create accurate BOQs, standardize costing, compare vendors, manage approvals,
                    and move projects from estimation to procurement—all in one connected workspace.
                </p>
                <div className="client-branding-dots" aria-hidden="true">
                    <span className="active" />
                    <span />
                    <span />
                </div>
            </aside>

            {/* Right White Content Panel */}
            <section className="client-content-panel">
                <div className="client-panel-inner">
                    {!hideDefaultHeader && (
                        <>
                            {icon ? (
                                icon
                            ) : title ? (
                                <div className="client-mini-logo" aria-label="BOQ Logo">
                                    <img src="/assets/boq-logo-small.svg" alt="BOQ" />
                                </div>
                            ) : null}

                            {eyebrow && <div className="client-eyebrow">{eyebrow}</div>}
                            {title && <h2 className="client-title">{title}</h2>}
                            {subtitle && <p className="client-subtitle">{subtitle}</p>}
                        </>
                    )}

                    {children}
                </div>

                <footer className="client-footer">
                    <span>2026 BOQ. All Rights Reserved.</span>
                    <div className="client-footer-links">
                        <Link href="/privacy-policy">Privacy Policy</Link>
                        <Link href="/terms-of-service">Terms of Service</Link>
                    </div>
                </footer>
            </section>
        </main>
    );
}
