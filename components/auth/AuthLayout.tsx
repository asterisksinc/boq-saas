import type { ReactNode } from "react";

export function AuthLayout({
    title,
    subtitle,
    children,
    footer,
    iconSrc,
    iconAlt = "",
}: {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer?: ReactNode;
    iconSrc?: string;
    iconAlt?: string;
}) {
    return (
        <main className="auth-shell">
            <aside className="auth-visual" aria-label="BOQ branding panel">
                <div className="auth-visual-sheen" aria-hidden="true" />
                <div className="auth-left-logo" aria-label="BOQ logo">
                    <img src="/assets/boq-logo-large.svg" alt="BOQ logo" />
                </div>
                <h1 className="auth-left-title">One Platform for Every Commercial Decision</h1>
                <p className="auth-left-copy">
                    Create accurate BOQs, standardize costing, compare vendors, manage approvals,
                    and move projects from estimation to procurement—all in one connected workspace.
                </p>
                <div className="auth-left-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </div>
            </aside>

            <section className="auth-panel-shell">
                <div className="auth-panel-inner">
                    <div className={`auth-mini-logo${iconSrc ? " auth-mini-logo--utility" : ""}`} aria-label={iconSrc ? iconAlt : "BOQ small logo"}>
                        <img src={iconSrc ?? "/assets/boq-logo-small.svg"} alt={iconSrc ? iconAlt : "BOQ logo"} />
                    </div>

                    <h2 className="auth-panel-title">{title}</h2>
                    <p className="auth-panel-subtitle">{subtitle}</p>

                    {children}
                </div>

                {footer ? <div className="auth-footer">{footer}</div> : null}
            </section>
        </main>
    );
}
