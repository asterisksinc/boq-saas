"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { getApiErrorMessage, getOnboardingState, saveOnboardingState, verifyEmailCode } from "@/lib/api/auth";

const stepMeta = [
    {
        id: "workspace",
        label: "Workspace",
        title: "Set Up Your Workspace",
        subtitle: "Tell us about your business so we can set up the right workspace for you.",
    },
    {
        id: "workflow",
        label: "Workflow",
        title: "Set Up Your Workflow",
        subtitle: "Configure a few basics. You can change these later from Settings.",
    },
    {
        id: "project",
        label: "Project",
        title: "How Would You Like to Get Started?",
        subtitle: "Start with a new project or bring your existing BOQ into your workspace.",
    },
    {
        id: "first-project",
        label: "First Project",
        title: "Create Your First Project",
        subtitle: "Start with the project your team is currently working on.",
    },
    {
        id: "import-boq",
        label: "Create First Project",
        title: "Import Your Existing BOQ",
        subtitle: "Upload an Excel or CSV file and we’ll help structure your BOQ data.",
    },
] as const;

const businessTypes = [
    { label: "Interior Design Studio", icon: "/assets/business-interior-design.svg" },
    { label: "Architecture Firm", icon: "/assets/business-architecture.svg" },
    { label: "Turnkey Contractor", icon: "/assets/business-turnkey.svg" },
    { label: "Design-Build Firm", icon: "/assets/business-design-build.svg" },
    { label: "Interior Contractor", icon: "/assets/business-contractor.svg" },
    { label: "Other", icon: "/assets/business-other.svg" },
];

const onboardingStepCopy = [
    { label: "Workspace", description: "Tell us about your business" },
    { label: "Workflow", description: "Configure a few basics." },
    { label: "Project", description: "Start with new or Existing" },
    { label: "Create First Project", description: "Start with the project" },
];

const teamSizes = ["Just Me", "2-5", "6-20", "21-50", "51-200", "200+"];
const projectStatuses = ["Active", "On Hold", "Planning"];

export default function OnboardingPage() {
    return (
        <Suspense fallback={<main className="onboarding-shell" />}>
            <OnboardingContent />
        </Suspense>
    );
}

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const verificationCode = searchParams.get("code");
    const exchangedVerificationCode = useRef<string | null>(null);
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");
    const [businessType, setBusinessType] = useState("Interior Design Studio");
    const [teamSize, setTeamSize] = useState("2-5");
    const [currency, setCurrency] = useState("Indian Rupee (₹)");
    const [measurementSystem, setMeasurementSystem] = useState("Metric (m, sq.m, cu.m)");
    const [taxType, setTaxType] = useState("GST (India)");
    const [defaultMarkup, setDefaultMarkup] = useState("0");
    const [projectName, setProjectName] = useState("ex. Sharma Residence");
    const [clientName, setClientName] = useState("ex. John Doe");
    const [projectType, setProjectType] = useState("");
    const [projectStatus, setProjectStatus] = useState("Active");
    const [projectLocation, setProjectLocation] = useState("ex. Mumbai, Maharashtra");
    const [pathSelection, setPathSelection] = useState<"scratch" | "import" | null>("scratch");
    const [isUploadReady, setIsUploadReady] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState("");
    const [language, setLanguage] = useState("ENG");
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    const currentTitle = useMemo(() => stepMeta[step]?.title ?? "Set Up Your Workspace", [step]);
    const currentSubtitle = useMemo(() => stepMeta[step]?.subtitle ?? "", [step]);

    useEffect(() => {
        async function load() {
            try {
                if (verificationCode) {
                    if (exchangedVerificationCode.current === verificationCode) return;
                    exchangedVerificationCode.current = verificationCode;
                    setLoading(true);
                    await verifyEmailCode(verificationCode);
                    router.replace("/onboarding");
                    return;
                }

                const state = await getOnboardingState();
                if (state.company?.name) setWorkspaceName(state.company.name);
                if (state.company?.currency) setCurrency(state.company.currency);
                if (state.company?.timezone) setProjectLocation((current) => current || state.company?.timezone || current);
                if (state.currentStep) {
                    const index = stepMeta.findIndex((item) => item.id === state.currentStep);
                    if (index >= 0) setStep(index);
                }
            } catch (requestError) {
                const message = getApiErrorMessage(requestError);
                if (/401|UNAUTHENTICATED/i.test(message)) {
                    router.replace("/login");
                    return;
                }
                setError(message);
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, [router, verificationCode]);

    const persistStep = async (nextStep: number) => {
        setLoading(true);
        setError("");

        try {
            await saveOnboardingState({
                currentStep: stepMeta[nextStep]?.id,
                completedSteps: stepMeta.slice(0, nextStep + 1).map((item) => item.id),
                company: {
                    name: workspaceName,
                    currency: currency === "Indian Rupee (₹)" ? "INR" : undefined,
                },
            });
            setStep(nextStep);
        } catch (requestError) {
            const message = getApiErrorMessage(requestError);
            if (/401|UNAUTHENTICATED/i.test(message)) {
                router.replace("/login");
                return;
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setSelectedFileName(file.name);
        setIsUploadReady(true);
    };

    const goNext = async () => {
        if (step < stepMeta.length - 1) {
            await persistStep(step + 1);
            return;
        }

        try {
            setLoading(true);
            await saveOnboardingState({
                currentStep: "dashboard",
                completedSteps: ["workspace", "workflow", "project", "first-project", "import-boq"],
                company: { name: workspaceName, currency: currency === "Indian Rupee (₹)" ? "INR" : undefined },
            });
            router.push("/dashboard");
        } catch (requestError) {
            const message = getApiErrorMessage(requestError);
            if (/401|UNAUTHENTICATED/i.test(message)) {
                router.replace("/login");
                return;
            }
            setError(message);
            setLoading(false);
        }
    };

    const goBack = () => {
        setStep((current) => Math.max(current - 1, 0));
    };

    const isWorkspaceStep = step === 0;
    const isWorkflowStep = step === 1;
    const isChoiceStep = step === 2;
    const isProjectStep = step === 3;
    const isImportStep = step === 4;

    return (
        <main className="onboarding-shell">
            <header className="onboarding-header">
                <div className="onboarding-logo" aria-label="BOQ logo">
                    <img src="/assets/boq-logo-small.svg" alt="BOQ logo" />
                </div>
                <div className={`lang-pill-wrapper ${showLangDropdown ? 'active' : ''}`}>
                    <button
                        type="button"
                        className="lang-pill"
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        aria-label="Language selector"
                        aria-haspopup="true"
                        aria-expanded={showLangDropdown}
                    >
                        <img src="/assets/globe.svg" alt="" aria-hidden="true" />
                        <span>{language}</span>
                        <img src="/assets/dropdown.svg" alt="" aria-hidden="true" style={{ width: '12px', height: '12px' }} />
                    </button>
                    <div className="lang-dropdown" role="menu">
                        <button
                            type="button"
                            className={`lang-option ${language === 'ENG' ? 'selected' : ''}`}
                            onClick={() => {
                                setLanguage('ENG');
                                setShowLangDropdown(false);
                            }}
                            role="menuitem"
                        >
                            English (ENG)
                        </button>
                        <button
                            type="button"
                            className={`lang-option ${language === 'HIN' ? 'selected' : ''}`}
                            onClick={() => {
                                setLanguage('HIN');
                                setShowLangDropdown(false);
                            }}
                            role="menuitem"
                        >
                            हिन्दी (HIN)
                        </button>
                        <button
                            type="button"
                            className={`lang-option ${language === 'FRA' ? 'selected' : ''}`}
                            onClick={() => {
                                setLanguage('FRA');
                                setShowLangDropdown(false);
                            }}
                            role="menuitem"
                        >
                            Français (FRA)
                        </button>
                        <button
                            type="button"
                            className={`lang-option ${language === 'SPA' ? 'selected' : ''}`}
                            onClick={() => {
                                setLanguage('SPA');
                                setShowLangDropdown(false);
                            }}
                            role="menuitem"
                        >
                            Español (SPA)
                        </button>
                    </div>
                </div>
            </header>

            <div className="onboarding-layout">
                <aside className="onboarding-aside">
                    <div className="onboarding-aside-title"><img src="/assets/setup-account.svg" alt="" aria-hidden="true" />Set up your account</div>
                    <div className="onboarding-steps">
                        {onboardingStepCopy.map((item, index) => {
                            const isCurrent = index === step;
                            const isDone = index < step;
                            return (
                                <div key={item.label} className={`onboarding-step ${isCurrent ? "active" : ""} ${isDone ? "done" : ""}`}>
                                    <span className="step-dot" aria-hidden="true" />
                                    <span className="step-copy"><span className="step-label">{item.label}</span><span className="step-description">{item.description}</span></span>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                <section className="onboarding-main">
                    <div className="onboarding-card">
                        {error ? <p className="error-banner" role="alert">{error}</p> : null}

                        {isWorkspaceStep ? (
                            <>
                                <h1>{currentTitle}</h1>
                                <p className="onboarding-subtitle">{currentSubtitle}</p>

                                <div className="stacked-form">
                                    <label className="onboarding-field">
                                        <span>Company / Workspace Name <em>*</em></span>
                                        <input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="ex. Studio Forma" />
                                    </label>

                                    <label className="onboarding-field">
                                        <span>Business Type <em>*</em></span>
                                        <div className="option-grid option-grid-2">
                                            {businessTypes.map((type) => (
                                                <button
                                                    key={type.label}
                                                    type="button"
                                                    className={`select-option ${businessType === type.label ? "selected" : ""}`}
                                                    onClick={() => setBusinessType(type.label)}
                                                >
                                                    <img src={type.icon} alt="" aria-hidden="true" />
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </label>

                                    <label className="onboarding-field">
                                        <span>Team Size <em>*</em></span>
                                        <div className="option-grid option-grid-6">
                                            {teamSizes.map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    className={`select-chip ${teamSize === size ? "selected" : ""}`}
                                                    onClick={() => setTeamSize(size)}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </label>
                                </div>
                            </>
                        ) : null}

                        {isWorkflowStep ? (
                            <>
                                <h1>{currentTitle}</h1>
                                <p className="onboarding-subtitle">{currentSubtitle}</p>

                                <div className="workflow-info-box">
                                    <div className="info-icon">ⓘ</div>
                                    <span>These settings apply to all BOQs and cost sheets in your workspace. They can be changed later.</span>
                                </div>

                                <div className="stacked-form compact-form">
                                    <label className="onboarding-field">
                                        <span>Currency <em>*</em></span>
                                        <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                                            <option>Indian Rupee (₹)</option>
                                            <option>US Dollar ($)</option>
                                            <option>Euro (€)</option>
                                        </select>
                                    </label>

                                    <label className="onboarding-field">
                                        <span>Measurement System <em>*</em></span>
                                        <select value={measurementSystem} onChange={(event) => setMeasurementSystem(event.target.value)}>
                                            <option>Metric (m, sq.m, cu.m)</option>
                                            <option>Imperial (ft, sq.ft)</option>
                                        </select>
                                    </label>

                                    <div className="split-row">
                                        <label className="onboarding-field">
                                            <span>Tax / GST <em>*</em></span>
                                            <select value={taxType} onChange={(event) => setTaxType(event.target.value)}>
                                                <option>GST (India)</option>
                                                <option>No Tax</option>
                                                <option>VAT</option>
                                            </select>
                                        </label>

                                        <label className="onboarding-field">
                                            <span>Default Markup</span>
                                            <div className="markup-field">
                                                <input value={defaultMarkup} onChange={(event) => setDefaultMarkup(event.target.value)} />
                                                <span>%</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </>
                        ) : null}

                        {isChoiceStep ? (
                            <>
                                <h1>{currentTitle}</h1>
                                <p className="onboarding-subtitle">{currentSubtitle}</p>

                                <div className="choice-grid">
                                    <button
                                        type="button"
                                        className={`choice-card ${pathSelection === "scratch" ? "selected" : ""}`}
                                        onClick={() => setPathSelection("scratch")}
                                    >
                                        <div className="choice-icon">＋</div>
                                        <h3>Start From Scratch</h3>
                                        <p>Create your first project and build a structured BOQ from the ground up.</p>
                                        <span className="choice-button">Create a Project</span>
                                    </button>

                                    <button
                                        type="button"
                                        className={`choice-card ${pathSelection === "import" ? "selected" : ""}`}
                                        onClick={() => {
                                            setPathSelection("import");
                                            setStep(4);
                                        }}
                                    >
                                        <div className="choice-icon">＋</div>
                                        <h3>Import an existing BOQ</h3>
                                        <p>Bring your Excel or CSV data into a structured BOQ workflow.</p>
                                        <span className="choice-button">Import BOQ</span>
                                    </button>
                                </div>

                                <div className="choice-footer">
                                    <button type="button" className="secondary-btn" onClick={goBack}>Back</button>
                                    <button type="button" className="primary-btn" onClick={() => pathSelection === "scratch" ? setStep(3) : setStep(4)}>
                                        Continue
                                    </button>
                                </div>
                            </>
                        ) : null}

                        {isProjectStep ? (
                            <>
                                <h1>{currentTitle}</h1>
                                <p className="onboarding-subtitle">{currentSubtitle}</p>

                                <div className="stacked-form compact-form">
                                    <div className="split-row">
                                        <label className="onboarding-field">
                                            <span>Project Name <em>*</em></span>
                                            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
                                        </label>

                                        <label className="onboarding-field">
                                            <span>Client Name <em>*</em></span>
                                            <input value={clientName} onChange={(event) => setClientName(event.target.value)} />
                                        </label>
                                    </div>

                                    <label className="onboarding-field">
                                        <span>Project Type <em>*</em></span>
                                        <select value={projectType} onChange={(event) => setProjectType(event.target.value)}>
                                            <option value="">Select project type</option>
                                            <option>Residential</option>
                                            <option>Commercial</option>
                                            <option>Hospitality</option>
                                            <option>Retail</option>
                                        </select>
                                    </label>

                                    <label className="onboarding-field">
                                        <span>Project Status <em>*</em></span>
                                        <div className="status-toggle">
                                            {projectStatuses.map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    className={`select-chip ${projectStatus === status ? "selected" : ""}`}
                                                    onClick={() => setProjectStatus(status)}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </label>

                                    <label className="onboarding-field">
                                        <span>Project Location</span>
                                        <input value={projectLocation} onChange={(event) => setProjectLocation(event.target.value)} />
                                    </label>
                                </div>
                            </>
                        ) : null}

                        {isImportStep ? (
                            <>
                                <h1>{currentTitle}</h1>
                                <p className="onboarding-subtitle">{currentSubtitle}</p>

                                <div className="upload-box">
                                    <label htmlFor="boq-upload" className="upload-label">
                                        <span className="upload-icon">⇪</span>
                                        <span className="upload-title">Drag &amp; Drop Your File Here</span>
                                        <span className="upload-or">or</span>
                                        <span className="upload-button">Explore Templates</span>
                                        <input id="boq-upload" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                                    </label>
                                    <p className="upload-meta">Supported: .xlsx, .xls, .csv • Maximum file size: 25 MB</p>
                                </div>
                            </>
                        ) : null}

                        {!isChoiceStep && !isImportStep ? (
                            <div className="footer-row">
                                <button type="button" className="secondary-btn" onClick={goBack}>Back</button>
                                <button type="button" className="primary-btn" onClick={goNext} disabled={loading}>
                                    {step === 3 ? "Create a Project" : step === 4 ? "Import BOQ" : "Continue"}
                                </button>
                            </div>
                        ) : null}
                    </div>
                </section>
            </div>
        </main>
    );
}
