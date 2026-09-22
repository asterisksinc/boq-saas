"use client";

import {
    ChevronRight,
    X,
    UploadCloud,
    Check,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    FileText,
    FileSpreadsheet,
    Loader2,
    Send,
    Bookmark,
    ArrowLeft,
    Sparkles,
    ExternalLink,
    HelpCircle,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import {
    createSupportTicket,
    updateSupportTicket,
    formatTicketDescription,
    parseTicketMetadata,
    SupportTicket,
    TicketMetadata,
    HelpArticle,
} from "@/lib/api/auth";

export interface TicketWizardDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onTicketCreated: (ticket: SupportTicket, wasDraft?: boolean) => void;
    initialData?: SupportTicket | null;
    initialArticleTitle?: string | null;
    helpArticles?: HelpArticle[];
}

const CATEGORIES = [
    "Account and Login",
    "Projects",
    "BOQs",
    "Costing",
    "Templates",
    "Proposals",
    "Invoice and Billing",
    "Documents",
    "Integrations",
    "Team and Permissions",
    "Client Portal",
    "Bug or Technical Issue",
    "Feature Request",
    "Other",
] as const;

const STEPS = [
    { id: 1, label: "Issue Type" },
    { id: 2, label: "Description" },
    { id: 3, label: "Context" },
    { id: 4, label: "Impact" },
    { id: 5, label: "Attachments" },
    { id: 6, label: "Help" },
    { id: 7, label: "Review" },
];

function detectBrowserAndDevice(): string {
    if (typeof window === "undefined") return "Web Browser";
    const ua = navigator.userAgent;
    let browser = "Browser";
    let os = "Desktop";

    if (ua.includes("Firefox/")) browser = "Firefox";
    else if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome/")) browser = "Chrome";
    else if (ua.includes("Safari/")) browser = "Safari";

    if (ua.includes("Windows NT 10.0") || ua.includes("Windows NT 11.0")) os = "Windows 10/11";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return `${browser} on ${os}`;
}

function formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TicketWizardDrawer({
    isOpen,
    onClose,
    onTicketCreated,
    initialData,
    initialArticleTitle,
    helpArticles = [],
}: TicketWizardDrawerProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [draftTicketId, setDraftTicketId] = useState<string | null>(null);

    // Form states
    const [issueType, setIssueType] = useState<string>("Bug or Technical Issue");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [attemptedAction, setAttemptedAction] = useState("");

    const [projectId, setProjectId] = useState<string>("");
    const [projectName, setProjectName] = useState<string>("");
    const [relatedRecord, setRelatedRecord] = useState("");
    const [browserDevice, setBrowserDevice] = useState("");

    const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
    const [businessImpact, setBusinessImpact] = useState("");

    const [attachments, setAttachments] = useState<
        Array<{ id?: string; name: string; size: number; type: string; url?: string }>
    >([]);

    // Projects list
    const [projects, setProjects] = useState<Array<{ id: string; name: string; code?: string }>>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    // UI state
    const [isDragOver, setIsDragOver] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [resolvedEarly, setResolvedEarly] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load projects list
    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        setLoadingProjects(true);
        fetch("/api/v1/projects?pageSize=100", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!active || !data) return;
                const items = data.data?.items || [];
                setProjects(items);
            })
            .catch(() => {})
            .finally(() => {
                if (active) setLoadingProjects(false);
            });
        return () => {
            active = false;
        };
    }, [isOpen]);

    // Initialize or Reset form on open
    useEffect(() => {
        if (!isOpen) return;
        setResolvedEarly(false);
        setErrorMsg(null);

        if (initialData) {
            setDraftTicketId(initialData.id);
            setIssueType(initialData.issueType || initialData.issue_type || "Bug or Technical Issue");
            setSubject(initialData.subject || "");
            setPriority(initialData.priority || "normal");

            const { cleanDescription, metadata } = parseTicketMetadata(initialData.description || "");
            setDescription(cleanDescription || "");
            setAttemptedAction(metadata.attemptedAction || "");
            setProjectId(metadata.projectId || "");
            setProjectName(metadata.projectName || "");
            setRelatedRecord(metadata.relatedRecord || "");
            setBrowserDevice(metadata.browserDevice || detectBrowserAndDevice());
            setBusinessImpact(metadata.businessImpact || "");
            setAttachments(metadata.attachments || []);
            setCurrentStep(metadata.currentStep && metadata.currentStep <= 7 ? metadata.currentStep : 1);
        } else {
            setDraftTicketId(null);
            setCurrentStep(1);
            setIssueType("Bug or Technical Issue");
            setAttemptedAction("");
            setProjectId("");
            setProjectName("");
            setRelatedRecord("");
            setBrowserDevice(detectBrowserAndDevice());
            setPriority("normal");
            setBusinessImpact("");
            setAttachments([]);

            if (initialArticleTitle) {
                setSubject(`Question regarding: ${initialArticleTitle}`);
                setDescription(`I was reading the help article "${initialArticleTitle}" and need help with:\n\n`);
                setCurrentStep(2);
            } else {
                setSubject("");
                setDescription("");
            }
        }
    }, [isOpen, initialData, initialArticleTitle]);

    // Check if form is dirty
    const isDirty = useMemo(() => {
        return Boolean(
            subject.trim() ||
                description.trim() ||
                attemptedAction.trim() ||
                projectId ||
                relatedRecord.trim() ||
                businessImpact.trim() ||
                attachments.length > 0
        );
    }, [subject, description, attemptedAction, projectId, relatedRecord, businessImpact, attachments]);

    // Recommended articles for Step 06
    const recommendedArticles = useMemo(() => {
        if (!helpArticles || helpArticles.length === 0) return [];
        const query = `${issueType} ${subject} ${description}`.toLowerCase();

        const categoryMapping: Record<string, string> = {
            "Account and Login": "account-billing",
            "Invoice and Billing": "account-billing",
            Projects: "projects-activities",
            BOQs: "boqs-costing",
            Costing: "boqs-costing",
            Templates: "boqs-costing",
            Proposals: "proposals-invoices",
            Documents: "documents",
            Integrations: "integrations",
            "Team and Permissions": "team-permissions",
        };

        const targetSlug = categoryMapping[issueType];

        const matched = helpArticles.filter((art) => {
            const artCat =
                (art.category as any)?.slug ||
                (art.help_categories as any)?.[0]?.slug ||
                (art.help_categories as any)?.slug;
            if (targetSlug && artCat === targetSlug) return true;
            const words = art.title.toLowerCase().split(" ");
            return words.some((w) => w.length > 3 && query.includes(w));
        });

        if (matched.length > 0) return matched.slice(0, 4);
        return helpArticles.slice(0, 3);
    }, [helpArticles, issueType, subject, description]);

    // Step navigation
    const handleCloseRequest = () => {
        if (isDirty && !resolvedEarly) {
            setShowDiscardModal(true);
        } else {
            onClose();
        }
    };

    const handleNextStep = () => {
        setErrorMsg(null);
        if (currentStep === 1) {
            if (!issueType) {
                setErrorMsg("Please select an issue category.");
                return;
            }
        } else if (currentStep === 2) {
            if (!subject.trim()) {
                setErrorMsg("Please enter a subject summary.");
                return;
            }
            if (!description.trim()) {
                setErrorMsg("Please provide a description of the issue.");
                return;
            }
        } else if (currentStep === 3) {
            if (!browserDevice.trim()) {
                setBrowserDevice(detectBrowserAndDevice());
            }
        } else if (currentStep === 4) {
            if (!businessImpact.trim()) {
                setErrorMsg("Please describe the business impact or urgency.");
                return;
            }
        }
        setCurrentStep((prev) => Math.min(7, prev + 1));
    };

    const handlePrevStep = () => {
        setErrorMsg(null);
        setCurrentStep((prev) => Math.max(1, prev - 1));
    };

    const handleJumpStep = (stepId: number) => {
        if (stepId <= currentStep) {
            setErrorMsg(null);
            setCurrentStep(stepId);
        }
    };

    // File handling
    const processFiles = (files: FileList | File[]) => {
        const list = Array.from(files);
        const newAttachments = [...attachments];

        for (const file of list) {
            if (file.size > 25 * 1024 * 1024) {
                setErrorMsg(`File "${file.name}" exceeds the 25MB limit.`);
                continue;
            }
            newAttachments.push({
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
                name: file.name,
                size: file.size,
                type: file.type || "application/octet-stream",
            });
        }

        setAttachments(newAttachments);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
    };

    const handleRemoveFile = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    // Build payload helper
    const buildTicketPayload = (status: "draft" | "open") => {
        const metadata: TicketMetadata = {
            currentStep,
            attemptedAction: attemptedAction.trim() || undefined,
            projectId: projectId || undefined,
            projectName: projectName || undefined,
            relatedRecord: relatedRecord.trim() || undefined,
            browserDevice: browserDevice.trim() || undefined,
            businessImpact: businessImpact.trim() || undefined,
            attachments,
        };

        const finalSubject = subject.trim() || (status === "draft" ? `Draft: ${issueType}` : "Support Ticket");
        const baseDescription = description.trim() || (status === "draft" ? "Draft ticket in progress..." : "No description provided.");
        const formattedDescription = formatTicketDescription(baseDescription, metadata);

        return {
            issueType,
            subject: finalSubject,
            description: formattedDescription,
            priority,
            status,
            projectId: projectId || null,
            projectName: projectName || null,
            relatedRecord: relatedRecord.trim() || null,
            browserDevice: browserDevice.trim() || null,
            businessImpact: businessImpact.trim() || null,
            attemptedAction: attemptedAction.trim() || null,
            attachments,
        };
    };

    // Save as Draft
    const handleSaveDraft = async () => {
        setSavingDraft(true);
        setErrorMsg(null);
        try {
            const payload = buildTicketPayload("draft");
            let result: SupportTicket;
            if (draftTicketId) {
                result = await updateSupportTicket(draftTicketId, payload);
            } else {
                result = await createSupportTicket(payload);
                setDraftTicketId(result.id);
            }
            onTicketCreated(result, true);
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || "Could not save draft ticket.");
        } finally {
            setSavingDraft(false);
            setShowDiscardModal(false);
        }
    };

    // Final Submit
    const handleSubmitTicket = async () => {
        if (!subject.trim()) {
            setErrorMsg("Subject is required.");
            setCurrentStep(2);
            return;
        }
        if (!description.trim()) {
            setErrorMsg("Description is required.");
            setCurrentStep(2);
            return;
        }

        setSubmitting(true);
        setErrorMsg(null);
        try {
            const payload = buildTicketPayload("open");
            let result: SupportTicket;
            if (draftTicketId) {
                result = await updateSupportTicket(draftTicketId, payload);
            } else {
                result = await createSupportTicket(payload);
            }
            onTicketCreated(result, false);
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || "Could not submit support ticket.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop with blur */}
            <div className="ticket-drawer-backdrop" onClick={handleCloseRequest} />

            {/* Slide-over Drawer Panel */}
            <div className="ticket-drawer" role="dialog" aria-modal="true">
                {/* Header */}
                <div className="ticket-drawer-header">
                    <div className="ticket-drawer-header-content">
                        <h2>Let's Get This Sorted.</h2>
                        <p>
                            {draftTicketId ? "Resuming saved draft ticket" : "Submit a request to our engineering and support specialists"}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="ticket-drawer-close-btn"
                        onClick={handleCloseRequest}
                        aria-label="Close ticket drawer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Stepper Bar */}
                <div className="ticket-stepper-wrap">
                    <div className="ticket-stepper">
                        {STEPS.map((s, idx) => {
                            const isCompleted = s.id < currentStep;
                            const isActive = s.id === currentStep;
                            const isUpcoming = s.id > currentStep;

                            return (
                                <div key={s.id} style={{ display: "contents" }}>
                                    <button
                                        type="button"
                                        className={`ticket-step-node ${isActive ? "active" : isCompleted ? "completed" : "upcoming"}`}
                                        onClick={() => handleJumpStep(s.id)}
                                        disabled={isUpcoming}
                                    >
                                        <div className="ticket-step-circle">
                                            {isCompleted ? <Check size={14} strokeWidth={3} /> : s.id}
                                        </div>
                                        <span className="ticket-step-label">{s.label}</span>
                                    </button>
                                    {idx < STEPS.length - 1 && (
                                        <div
                                            className={`ticket-step-line ${s.id < currentStep ? "completed" : ""}`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Drawer Body (Steps 1 to 7) */}
                <div className="ticket-drawer-body">
                    {errorMsg && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 14px",
                                background: "#fee2e2",
                                border: "1px solid #fecaca",
                                borderRadius: "8px",
                                color: "#b91c1c",
                                fontSize: "13px",
                                marginBottom: "16px",
                            }}
                        >
                            <AlertTriangle size={16} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* ================= STEP 01: ISSUE TYPE ================= */}
                    {currentStep === 1 && (
                        <div>
                            <div className="ticket-step-header">
                                <span className="ticket-step-tag">Step 01 of 07</span>
                                <h3 className="ticket-step-title">Select the category that best describes your issue</h3>
                                <p className="ticket-step-desc">
                                    Choosing the right area routes your ticket directly to the specialized engineering team.
                                </p>
                            </div>

                            <div className="ticket-category-grid">
                                {CATEGORIES.map((cat) => {
                                    const isSelected = issueType === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            className={`ticket-category-card ${isSelected ? "active" : ""}`}
                                            onClick={() => {
                                                setIssueType(cat);
                                                setErrorMsg(null);
                                            }}
                                        >
                                            <span>{cat}</span>
                                            <ChevronRight size={16} className="category-icon-chevron" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 02: DESCRIPTION ================= */}
                    {currentStep === 2 && (
                        <div>
                            <div className="ticket-step-header">
                                <span className="ticket-step-tag">Step 02 of 07</span>
                                <h3 className="ticket-step-title">Tell us more about what happened</h3>
                                <p className="ticket-step-desc">
                                    Give our support team clear details to help diagnose and resolve your issue quickly.
                                </p>
                            </div>

                            <div className="ticket-form-group">
                                <label>
                                    <span>
                                        Subject <span className="req-star">*</span>
                                    </span>
                                    <span className="helper-tag">{subject.length}/200</span>
                                </label>
                                <input
                                    type="text"
                                    className="ticket-input"
                                    placeholder="e.g. Cannot export BOQ workbook or Rate discrepancy in costing"
                                    value={subject}
                                    maxLength={200}
                                    onChange={(e) => setSubject(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="ticket-form-group">
                                <label>
                                    <span>
                                        Description <span className="req-star">*</span>
                                    </span>
                                </label>
                                <textarea
                                    className="ticket-textarea"
                                    rows={5}
                                    placeholder="Please describe what you experienced in detail. Include any error messages, unexpected behaviors, or incorrect numbers..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="ticket-form-group">
                                <label>
                                    <span>What were you trying to do?</span>
                                    <span className="helper-tag">Optional</span>
                                </label>
                                <textarea
                                    className="ticket-textarea"
                                    rows={3}
                                    placeholder="e.g. I opened the project, navigated to BOQs, clicked 'Export XLSX', but nothing happened after 30 seconds."
                                    value={attemptedAction}
                                    onChange={(e) => setAttemptedAction(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 03: CONTEXT ================= */}
                    {currentStep === 3 && (
                        <div>
                            <div className="ticket-step-header">
                                <span className="ticket-step-tag">Step 03 of 07</span>
                                <h3 className="ticket-step-title">Provide context about your workspace</h3>
                                <p className="ticket-step-desc">
                                    Helping us pinpoint where the issue occurs makes replication and debugging significantly faster.
                                </p>
                            </div>

                            <div className="ticket-form-group">
                                <label>
                                    <span>Project</span>
                                    {loadingProjects && (
                                        <span className="helper-tag">
                                            <Loader2 size={12} className="spin" /> Loading projects...
                                        </span>
                                    )}
                                </label>
                                <select
                                    className="ticket-select"
                                    value={projectId}
                                    onChange={(e) => {
                                        const pId = e.target.value;
                                        setProjectId(pId);
                                        const found = projects.find((p) => p.id === pId);
                                        setProjectName(found ? found.name : "");
                                    }}
                                >
                                    <option value="">General / Not tied to a specific project</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.code ? `(${p.code})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="ticket-form-group">
                                <label>
                                    <span>Related Record / ID</span>
                                    <span className="helper-tag">Optional</span>
                                </label>
                                <input
                                    type="text"
                                    className="ticket-input"
                                    placeholder="e.g. BOQ Item #42, Invoice #INV-2026-08, or page URL"
                                    value={relatedRecord}
                                    onChange={(e) => setRelatedRecord(e.target.value)}
                                />
                            </div>

                            <div className="ticket-form-group">
                                <label>
                                    <span>Browser or Device</span>
                                    <span className="helper-tag">Auto-detected</span>
                                </label>
                                <input
                                    type="text"
                                    className="ticket-input"
                                    placeholder="e.g. Chrome on Windows 11"
                                    value={browserDevice}
                                    onChange={(e) => setBrowserDevice(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 04: IMPACT ================= */}
                    {currentStep === 4 && (
                        <div>
                            <div className="ticket-step-header">
                                <span className="ticket-step-tag">Step 04 of 07</span>
                                <h3 className="ticket-step-title">Assess severity and business impact</h3>
                                <p className="ticket-step-desc">
                                    Let us know how urgently this affects your operations so we can prioritize accordingly.
                                </p>
                            </div>

                            <div className="ticket-form-group">
                                <label>
                                    <span>
                                        Priority <span className="req-star">*</span>
                                    </span>
                                </label>
                                <div className="ticket-priority-grid">
                                    {[
                                        {
                                            id: "low",
                                            label: "Low",
                                            color: "#16a34a",
                                            bg: "#f0fdf4",
                                            desc: "General question, cosmetic issue, or minor feedback.",
                                        },
                                        {
                                            id: "normal",
                                            label: "Normal",
                                            color: "#2563eb",
                                            bg: "#eff6ff",
                                            desc: "Standard issue with an available workaround.",
                                        },
                                        {
                                            id: "high",
                                            label: "High",
                                            color: "#d97706",
                                            bg: "#fffbeb",
                                            desc: "Major feature failure directly affecting work progress.",
                                        },
                                        {
                                            id: "urgent",
                                            label: "Urgent",
                                            color: "#dc2626",
                                            bg: "#fef2f2",
                                            desc: "Critical blocker, severe outage, or risk of data loss.",
                                        },
                                    ].map((item) => {
                                        const isSelected = priority === item.id;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`ticket-priority-card ${isSelected ? "active" : ""}`}
                                                onClick={() => setPriority(item.id as any)}
                                            >
                                                <div className="ticket-priority-top">
                                                    <span
                                                        className="ticket-priority-badge"
                                                        style={{ background: item.bg, color: item.color }}
                                                    >
                                                        {item.label}
                                                    </span>
                                                </div>
                                                <p className="ticket-priority-desc">{item.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="ticket-form-group">
                                <label>
                                    <span>
                                        Business Impact <span className="req-star">*</span>
                                    </span>
                                </label>
                                <textarea
                                    className="ticket-textarea"
                                    rows={4}
                                    placeholder="Explain how this issue impacts your work, client deliverables, or upcoming project deadlines..."
                                    value={businessImpact}
                                    onChange={(e) => setBusinessImpact(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 05: ATTACHMENTS ================= */}
                    {currentStep === 5 && (
                        <div>
                            <div className="ticket-step-header">
                                <span className="ticket-step-tag">Step 05 of 07</span>
                                <h3 className="ticket-step-title">Attach screenshots or relevant files</h3>
                                <p className="ticket-step-desc">
                                    Visual evidence or files (spreadsheets, logs, PDFs) reduce back-and-forth communication.
                                </p>
                            </div>

                            {/* Dropzone */}
                            <div
                                className={`ticket-dropzone ${isDragOver ? "dragover" : ""}`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragOver(true);
                                }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: "none" }}
                                    multiple
                                    accept=".png,.jpg,.jpeg,.pdf,.xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                />
                                <div className="ticket-dropzone-icon">
                                    <UploadCloud size={24} />
                                </div>
                                <h4 className="ticket-dropzone-title">Click to upload or drag & drop files here</h4>
                                <p className="ticket-dropzone-subtitle">
                                    Supports PNG, JPG, PDF, Excel (.xlsx, .xls), and CSV (max 25MB each)
                                </p>
                            </div>

                            {/* Security Notice */}
                            <div className="ticket-security-notice">
                                <ShieldAlert size={18} />
                                <div>
                                    <strong>Security Notice:</strong> Please do NOT attach passwords, authentication tokens,
                                    credit card details, or sensitive client identification information.
                                </div>
                            </div>

                            {/* Uploaded Files List */}
                            {attachments.length > 0 && (
                                <div className="ticket-file-list">
                                    <h5 style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", margin: "4px 0" }}>
                                        ATTACHED FILES ({attachments.length})
                                    </h5>
                                    {attachments.map((file, idx) => (
                                        <div key={file.id || idx} className="ticket-file-item">
                                            <div className="ticket-file-info">
                                                {file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv") ? (
                                                    <FileSpreadsheet size={18} color="#16a34a" />
                                                ) : (
                                                    <FileText size={18} color="#2563eb" />
                                                )}
                                                <div>
                                                    <div className="ticket-file-name">{file.name}</div>
                                                    <div className="ticket-file-size">{formatFileSize(file.size)}</div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="ticket-file-remove-btn"
                                                onClick={() => handleRemoveFile(idx)}
                                                title="Remove attachment"
                                            >
                                                <X size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ================= STEP 06: SMART SUGGESTIONS ================= */}
                    {currentStep === 6 && (
                        <div>
                            <div className="ticket-step-header">
                                <span className="ticket-step-tag">Step 06 of 07</span>
                                <h3 className="ticket-step-title">Recommended articles that might help right now</h3>
                                <p className="ticket-step-desc">
                                    Based on your category and description, these official guides often provide instant solutions
                                    without waiting for a support response.
                                </p>
                            </div>

                            {resolvedEarly ? (
                                <div
                                    style={{
                                        background: "#f0fdf4",
                                        border: "1px solid #86efac",
                                        borderRadius: "12px",
                                        padding: "24px",
                                        textAlign: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "50%",
                                            background: "#dcfce7",
                                            color: "#16a34a",
                                            display: "grid",
                                            placeItems: "center",
                                            margin: "0 auto 12px",
                                        }}
                                    >
                                        <CheckCircle2 size={28} />
                                    </div>
                                    <h4 style={{ fontSize: "17px", fontWeight: 700, color: "#166534", margin: "0 0 6px" }}>
                                        Glad we could help!
                                    </h4>
                                    <p style={{ fontSize: "13px", color: "#15803d", margin: "0 0 16px" }}>
                                        Your ticket has not been submitted and no further action is required.
                                    </p>
                                    <button
                                        type="button"
                                        className="ticket-resolve-btn"
                                        style={{ margin: "0 auto" }}
                                        onClick={onClose}
                                    >
                                        Done & Close
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="ticket-suggestions-list">
                                        {recommendedArticles.map((art) => (
                                            <div key={art.id} className="ticket-suggestion-card">
                                                <div className="ticket-suggestion-top">
                                                    <h4 className="ticket-suggestion-title">{art.title}</h4>
                                                    <span className="ticket-suggestion-badge">
                                                        <Sparkles size={11} /> {art.readMinutes || 4} min
                                                    </span>
                                                </div>
                                                <p className="ticket-suggestion-body">{art.summary}</p>
                                                <div className="ticket-suggestion-actions">
                                                    <a
                                                        href={`/help/${art.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ticket-suggestion-link"
                                                    >
                                                        Read Full Guide <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="ticket-resolve-banner">
                                        <div>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#166534" }}>
                                                Did one of these guides solve your problem?
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#15803d" }}>
                                                You can close this wizard without creating an open ticket.
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="ticket-resolve-btn"
                                            onClick={() => setResolvedEarly(true)}
                                        >
                                            <Check size={14} /> Solved My Issue
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ================= STEP 07: REVIEW & SUBMIT ================= */}
                    {currentStep === 7 && (
                        <div>
                            <div className="ticket-step-header">
                                <span className="ticket-step-tag">Step 07 of 07</span>
                                <h3 className="ticket-step-title">Review your ticket before submitting</h3>
                                <p className="ticket-step-desc">
                                    Ensure all details are accurate. Click "Edit" on any section if you wish to modify it.
                                </p>
                            </div>

                            <div className="ticket-review-card">
                                {/* Section 1: Category */}
                                <div className="ticket-review-section">
                                    <div className="ticket-review-section-header">
                                        <span className="ticket-review-section-title">01. Issue Category</span>
                                        <button
                                            type="button"
                                            className="ticket-review-edit-btn"
                                            onClick={() => setCurrentStep(1)}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <p className="ticket-review-value-main">{issueType}</p>
                                </div>

                                {/* Section 2: Subject & Description */}
                                <div className="ticket-review-section">
                                    <div className="ticket-review-section-header">
                                        <span className="ticket-review-section-title">02. Subject & Description</span>
                                        <button
                                            type="button"
                                            className="ticket-review-edit-btn"
                                            onClick={() => setCurrentStep(2)}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <p className="ticket-review-value-main">{subject || "—"}</p>
                                    <p className="ticket-review-value-sub">{description || "—"}</p>
                                    {attemptedAction && (
                                        <p className="ticket-review-value-sub" style={{ marginTop: "6px", color: "#64748b" }}>
                                            <strong>Attempted action:</strong> {attemptedAction}
                                        </p>
                                    )}
                                </div>

                                {/* Section 3: Context */}
                                <div className="ticket-review-section">
                                    <div className="ticket-review-section-header">
                                        <span className="ticket-review-section-title">03. Context & Environment</span>
                                        <button
                                            type="button"
                                            className="ticket-review-edit-btn"
                                            onClick={() => setCurrentStep(3)}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div className="ticket-review-meta-grid">
                                        <div className="ticket-review-meta-item">
                                            <span className="ticket-review-meta-label">Project:</span>
                                            <span className="ticket-review-meta-val">
                                                {projectName || (projectId ? "Selected Project" : "General")}
                                            </span>
                                        </div>
                                        <div className="ticket-review-meta-item">
                                            <span className="ticket-review-meta-label">Related Record:</span>
                                            <span className="ticket-review-meta-val">{relatedRecord || "None"}</span>
                                        </div>
                                        <div className="ticket-review-meta-item" style={{ gridColumn: "span 2" }}>
                                            <span className="ticket-review-meta-label">Browser / Device:</span>
                                            <span className="ticket-review-meta-val">{browserDevice || "Web Browser"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Impact & Priority */}
                                <div className="ticket-review-section">
                                    <div className="ticket-review-section-header">
                                        <span className="ticket-review-section-title">04. Severity & Impact</span>
                                        <button
                                            type="button"
                                            className="ticket-review-edit-btn"
                                            onClick={() => setCurrentStep(4)}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                padding: "2px 8px",
                                                borderRadius: "9999px",
                                                textTransform: "uppercase",
                                                background:
                                                    priority === "urgent"
                                                        ? "#fef2f2"
                                                        : priority === "high"
                                                        ? "#fffbeb"
                                                        : priority === "low"
                                                        ? "#f0fdf4"
                                                        : "#eff6ff",
                                                color:
                                                    priority === "urgent"
                                                        ? "#dc2626"
                                                        : priority === "high"
                                                        ? "#d97706"
                                                        : priority === "low"
                                                        ? "#16a34a"
                                                        : "#2563eb",
                                            }}
                                        >
                                            {priority} priority
                                        </span>
                                    </div>
                                    <p className="ticket-review-value-sub">{businessImpact || "—"}</p>
                                </div>

                                {/* Section 5: Attachments */}
                                <div className="ticket-review-section">
                                    <div className="ticket-review-section-header">
                                        <span className="ticket-review-section-title">05. Attachments</span>
                                        <button
                                            type="button"
                                            className="ticket-review-edit-btn"
                                            onClick={() => setCurrentStep(5)}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    {attachments.length === 0 ? (
                                        <p className="ticket-review-value-sub" style={{ color: "#94a3b8" }}>
                                            No files attached.
                                        </p>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            {attachments.map((f, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        fontSize: "12.5px",
                                                        color: "#334155",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                    }}
                                                >
                                                    <FileText size={14} color="#2563eb" />
                                                    <span>{f.name}</span>
                                                    <span style={{ color: "#94a3b8", fontSize: "11px" }}>
                                                        ({formatFileSize(f.size)})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="ticket-drawer-footer">
                    <div>
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                className="ticket-drawer-btn-cancel"
                                onClick={handlePrevStep}
                                disabled={submitting || savingDraft}
                            >
                                <ArrowLeft size={14} style={{ display: "inline", marginRight: "4px" }} /> Back
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="ticket-drawer-btn-cancel"
                                onClick={handleCloseRequest}
                                disabled={submitting || savingDraft}
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                            type="button"
                            className="ticket-drawer-btn-draft"
                            onClick={handleSaveDraft}
                            disabled={submitting || savingDraft}
                        >
                            {savingDraft ? (
                                <>
                                    <Loader2 size={14} className="spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Bookmark size={14} /> Save as Draft
                                </>
                            )}
                        </button>

                        {currentStep < 7 ? (
                            <button
                                type="button"
                                className="ticket-drawer-btn-continue"
                                onClick={handleNextStep}
                                disabled={submitting || savingDraft}
                            >
                                Continue <ChevronRight size={14} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="ticket-drawer-btn-continue"
                                onClick={handleSubmitTicket}
                                disabled={submitting || savingDraft}
                                style={{ background: "#2563eb" }}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={14} className="spin" /> Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={14} /> Submit Ticket
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Discard Confirmation Modal */}
            {showDiscardModal && (
                <div className="ticket-confirm-modal-backdrop">
                    <div className="ticket-confirm-modal">
                        <h4 className="ticket-confirm-title">Unsaved Changes</h4>
                        <p className="ticket-confirm-desc">
                            You have changes in this ticket. Would you like to save it as a draft before closing so you can resume
                            later?
                        </p>
                        <div className="ticket-confirm-actions">
                            <button
                                type="button"
                                className="ticket-confirm-btn-discard"
                                onClick={() => {
                                    setShowDiscardModal(false);
                                    onClose();
                                }}
                            >
                                Discard Changes
                            </button>
                            <button
                                type="button"
                                className="ticket-confirm-btn-keep"
                                onClick={() => setShowDiscardModal(false)}
                            >
                                Keep Editing
                            </button>
                            <button
                                type="button"
                                className="ticket-confirm-btn-savedraft"
                                onClick={handleSaveDraft}
                            >
                                Save Draft & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
