"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";

type StepId = "welcome" | "documents" | "dashboard";

type ClientOnboardingLayoutProps = {
    currentStep?: StepId;
    activeStep?: StepId;
    completedSteps?: (StepId | string)[];
    projectId?: string;
    children: ReactNode;
};

const steps: Array<{ id: StepId; title: string; desc: string }> = [
    { id: "welcome", title: "Welcome", desc: "Tell us about your business" },
    { id: "documents", title: "Documents", desc: "Configure a few basics." },
    { id: "dashboard", title: "Dashboard", desc: "Start with new or Existing" },
];

export function ClientOnboardingLayout({
    currentStep,
    activeStep,
    completedSteps = [],
    projectId,
    children,
}: ClientOnboardingLayoutProps) {
    const [language, setLanguage] = useState("ENG");
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    const stepOrder: StepId[] = ["welcome", "documents", "dashboard"];
    const effectiveStep: StepId = activeStep || currentStep || "welcome";
    const currentIndex = stepOrder.indexOf(effectiveStep);

    return (
        <div className="client-onboarding-shell">
            {/* Header */}
            <header className="client-onboarding-header">
                <Link href="/" aria-label="BOQ SaaS Home">
                    <img src="/assets/boq-logo-small.svg" alt="BOQ" style={{ width: 34, height: 34 }} />
                </Link>

                <div className={`lang-pill-wrapper ${showLangDropdown ? "active" : ""}`}>
                    <button
                        type="button"
                        className="lang-pill"
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        aria-label="Language selector"
                        aria-haspopup="true"
                        aria-expanded={showLangDropdown}
                    >
                        <img src="/assets/globe.svg" alt="" aria-hidden="true" style={{ width: 14, height: 14 }} />
                        <span>{language}</span>
                        <img src="/assets/dropdown.svg" alt="" aria-hidden="true" style={{ width: 10, height: 10 }} />
                    </button>
                    <div className="lang-dropdown" role="menu">
                        {["ENG", "HIN", "FRA", "SPA"].map((lang) => (
                            <button
                                key={lang}
                                type="button"
                                className={`lang-option ${language === lang ? "selected" : ""}`}
                                onClick={() => {
                                    setLanguage(lang);
                                    setShowLangDropdown(false);
                                }}
                                role="menuitem"
                            >
                                {lang === "ENG"
                                    ? "English (ENG)"
                                    : lang === "HIN"
                                    ? "हिन्दी (HIN)"
                                    : lang === "FRA"
                                    ? "Français (FRA)"
                                    : "Español (SPA)"}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Layout body */}
            <div className="client-onboarding-body">
                {/* Left Progress Sidebar */}
                <aside className="client-onboarding-sidebar" aria-label="Onboarding Progress">
                    {steps.map((step, idx) => {
                        const isDone = completedSteps.includes(step.id) || idx < currentIndex;
                        const isCurrent = currentStep === step.id;
                        const isLast = idx === steps.length - 1;

                        return (
                            <div key={step.id} className="client-step-item">
                                {!isLast && <div className="client-step-line" aria-hidden="true" />}
                                <div
                                    className={`client-step-circle ${
                                        isDone ? "completed" : isCurrent ? "active" : "pending"
                                    }`}
                                >
                                    {isDone ? (
                                        <Check size={13} strokeWidth={3} />
                                    ) : null}
                                </div>
                                <div className="client-step-info">
                                    <span className={`client-step-title ${!isCurrent && !isDone ? "muted" : ""}`}>
                                        {step.title}
                                    </span>
                                    <span className="client-step-desc">{step.desc}</span>
                                </div>
                            </div>
                        );
                    })}
                </aside>

                {/* Main Content Area */}
                <main className="client-onboarding-main">{children}</main>
            </div>
        </div>
    );
}
