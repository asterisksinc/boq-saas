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
            {/* Header (Figma Frame 45: 88px height, 1px dashed #E2E8F0, padding 24px 44px) */}
            <header className="client-onboarding-header">
                <Link href="/" aria-label="BOQ SaaS Home" className="client-onboarding-logo-frame">
                    <img
                        src="/assets/boq-logo-small.svg"
                        alt="BOQ"
                        style={{ width: 40, height: 40 }}
                    />
                </Link>

                {/* Language / Option Selector (Figma Frame 12: 102x36px, border 1px solid #E2E8F0, radius 4px) */}
                <div className={`lang-pill-wrapper ${showLangDropdown ? "active" : ""}`}>
                    <button
                        type="button"
                        className="lang-pill"
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        aria-label="Language selector"
                        aria-haspopup="true"
                        aria-expanded={showLangDropdown}
                    >
                        <img
                            src="/assets/globe.svg"
                            alt=""
                            aria-hidden="true"
                            className="lang-globe"
                            style={{ width: 16, height: 16 }}
                        />
                        <span>{language}</span>
                        <img
                            src="/assets/dropdown.svg"
                            alt=""
                            aria-hidden="true"
                            className="lang-arrow"
                            style={{ width: 16, height: 16 }}
                        />
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

            {/* Layout body (Figma Frame 2147225025: Stepper Sidebar + Main Content) */}
            <div className="client-onboarding-body">
                {/* Left Progress Sidebar (Figma Frame 2147225024: 300px width, 1px dashed #E2E8F0) */}
                <aside className="client-onboarding-sidebar" aria-label="Onboarding Progress">
                    {steps.map((step, idx) => {
                        const isDone = completedSteps.includes(step.id) || idx < currentIndex;
                        const isCurrent = effectiveStep === step.id;
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
                                        <Check size={12} strokeWidth={2.5} color="#FFFFFF" />
                                    ) : isCurrent ? (
                                        <div className="client-step-dot" />
                                    ) : null}
                                </div>
                                <div className="client-step-info">
                                    <span
                                        className={`client-step-title ${
                                            !isCurrent ? "muted" : ""
                                        }`}
                                    >
                                        {step.title}
                                    </span>
                                    <span
                                        className={`client-step-desc ${
                                            !isCurrent ? "muted" : ""
                                        }`}
                                    >
                                        {step.desc}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </aside>

                {/* Main Content Area (Figma Frame 27) */}
                <main className="client-onboarding-main">{children}</main>
            </div>
        </div>
    );
}
