"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
    completeOnboarding,
    createBoq,
    createBoqImport,
    createProject,
    getApiErrorMessage,
    getOnboardingState,
    saveOnboardingState,
    verifyEmailCode,
} from "@/lib/api/auth";
import "./onboarding.css";

// --------------------------------------------------------------------------
// Constants & Options Matching Figma Reference
// --------------------------------------------------------------------------

const onboardingSteps = [
    { id: "workspace", label: "Workspace", description: "Tell us about your business" },
    { id: "workflow", label: "Workflow", description: "Configure a few basics." },
    { id: "project", label: "Project", description: "Start with new or Existing" },
    { id: "first-project", label: "Create First Project", description: "Start with the project" },
] as const;

const businessTypeOptions = [
    { label: "Interior Design Studio", icon: "/assets/business-interior-design.svg" },
    { label: "Architecture Firm", icon: "/assets/business-architecture.svg" },
    { label: "Turnkey Contractor", icon: "/assets/business-turnkey.svg" },
    { label: "Design-Build Firm", icon: "/assets/business-design-build.svg" },
    { label: "Interior Contractor", icon: "/assets/business-contractor.svg" },
    { label: "Other", icon: "/assets/business-other.svg" },
];

const teamSizeOptions = ["Just Me", "2-5", "6-20", "21-50", "51-200", "200+"];

const currencyOptions = [
    { label: "Indian Rupee (₹)", code: "INR" },
    { label: "US Dollar ($)", code: "USD" },
    { label: "Euro (€)", code: "EUR" },
    { label: "British Pound (£)", code: "GBP" },
    { label: "UAE Dirham (AED)", code: "AED" },
    { label: "Saudi Riyal (SAR)", code: "SAR" },
];

const measurementOptions = [
    { label: "Metric (m, sq.m, cu.m)", desc: "Millimeters, meters, square meters" },
    { label: "Imperial (ft, sq.ft, cu.ft)", desc: "Feet, inches, square feet" },
];

const taxOptions = [
    { label: "GST (India)", percent: 18 },
    { label: "VAT (Standard 5%)", percent: 5 },
    { label: "VAT (Standard 15%)", percent: 15 },
    { label: "Sales Tax (US)", percent: 8 },
    { label: "No Tax / Exempt", percent: 0 },
];

const projectTypeOptions = [
    "Residential",
    "Commercial",
    "Hospitality",
    "Retail",
    "Institutional",
    "Mixed Use",
];

const projectStatusOptions = ["Active", "Planning", "On Hold"];

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="onb-root" />}>
            <OnboardingContent />
        </Suspense>
    );
}

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const verificationCode = searchParams.get("code");
    const codeExchangeRef = useRef<string | null>(null);

    // Navigation & Global State
    const [step, setStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Step 1: Workspace
    const [workspaceName, setWorkspaceName] = useState("");
    const [businessType, setBusinessType] = useState("Interior Design Studio");
    const [customBusinessType, setCustomBusinessType] = useState("");
    const [teamSize, setTeamSize] = useState("2-5");

    // Step 2: Workflow
    const [currency, setCurrency] = useState("Indian Rupee (₹)");
    const [measurementSystem, setMeasurementSystem] = useState("Metric (m, sq.m, cu.m)");
    const [taxType, setTaxType] = useState("GST (India)");
    const [defaultMarkup, setDefaultMarkup] = useState("0");

    // Step 3: Project
    const [pathSelection, setPathSelection] = useState<"scratch" | "import">("scratch");

    // Step 4: Create First Project / Import
    const [projectName, setProjectName] = useState("");
    const [clientName, setClientName] = useState("");
    const [projectType, setProjectType] = useState("Residential");
    const [projectStatus, setProjectStatus] = useState("Active");
    const [projectLocation, setProjectLocation] = useState("");

    // Import BOQ state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileName, setSelectedFileName] = useState("");
    const [fileSizeFormatted, setFileSizeFormatted] = useState("");
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [importRowCount, setImportRowCount] = useState(0);
    const [importColumns, setImportColumns] = useState<string[]>([]);
    const [importRows, setImportRows] = useState<Array<Array<string | number | boolean | null>>>([]);
    const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
    const [isUploadReady, setIsUploadReady] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [importStatusText, setImportStatusText] = useState("");
    const [importedLineItemCount, setImportedLineItemCount] = useState(0);
    const [skippedLineItemCount, setSkippedLineItemCount] = useState(0);
    const [importedBoqId, setImportedBoqId] = useState<string | null>(null);
    const [importedBoqNumber, setImportedBoqNumber] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Completion State
    const [isCompleted, setIsCompleted] = useState(false);
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

    // Language dropdown
    const [language, setLanguage] = useState("ENG");
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    // ----------------------------------------------------------------------
    // Initial Load & Resume Incomplete Onboarding
    // ----------------------------------------------------------------------
    useEffect(() => {
        let isMounted = true;

        async function load() {
            try {
                if (verificationCode) {
                    if (codeExchangeRef.current === verificationCode) return;
                    codeExchangeRef.current = verificationCode;
                    setLoading(true);
                    await verifyEmailCode(verificationCode);
                    router.replace("/onboarding");
                    return;
                }

                const state = await getOnboardingState();
                if (!isMounted) return;

                // If user has already completed onboarding AND viewed dashboard/templates, redirect
                const hasViewedDashboard = typeof window !== "undefined" && window.sessionStorage.getItem("onboarding_viewed") === "true";
                if ((state.isCompleted || state.status === "completed" || state.currentStep === "complete") && hasViewedDashboard) {
                    router.replace("/dashboard");
                    return;
                }

                if (state.isCompleted || state.status === "completed" || state.currentStep === "complete") {
                    if (state.workspace?.name || state.company?.name) {
                        setWorkspaceName(state.workspace?.name || state.company?.name || "");
                    }
                    if (state.workflow?.currency) {
                        setCurrency(state.workflow.currency);
                    }
                    if (state.workflow?.measurementSystem) {
                        setMeasurementSystem(state.workflow.measurementSystem);
                    }
                    if (state.project?.details?.name) {
                        setProjectName(String(state.project.details.name));
                    }
                    if (state.project?.details?.projectId) {
                        setCreatedProjectId(String(state.project.details.projectId));
                    }
                    if (state.project?.details?.fileName) {
                        setSelectedFileName(String(state.project.details.fileName));
                    }
                    if (state.project?.details?.importedLineItemCount !== undefined) {
                        const count = Number(state.project.details.importedLineItemCount) || 0;
                        setImportedLineItemCount(count);
                        setImportRowCount(count);
                    }
                    if (state.project?.details?.skippedLineItemCount !== undefined) {
                        setSkippedLineItemCount(Number(state.project.details.skippedLineItemCount) || 0);
                    }
                    if (state.project?.details?.boqId) {
                        setImportedBoqId(String(state.project.details.boqId));
                    }
                    if (state.project?.details?.boqNumber) {
                        setImportedBoqNumber(String(state.project.details.boqNumber));
                    }
                    if (state.project?.startingOption) {
                        setPathSelection(state.project.startingOption === "import" ? "import" : "scratch");
                    }
                    setCompletedSteps(["workspace", "workflow", "project", "first-project"]);
                    setIsCompleted(true);
                    setLoading(false);
                    return;
                }

                // Restore Step 1 (Workspace)
                if (state.workspace?.name || state.company?.name) {
                    setWorkspaceName(state.workspace?.name || state.company?.name || "");
                }
                if (state.workspace?.businessType) {
                    const bType = state.workspace.businessType;
                    const matched = businessTypeOptions.some((b) => b.label === bType);
                    if (matched) {
                        setBusinessType(bType);
                    } else {
                        setBusinessType("Other");
                        setCustomBusinessType(bType);
                    }
                }
                if (state.workspace?.customBusinessType) {
                    setBusinessType("Other");
                    setCustomBusinessType(state.workspace.customBusinessType);
                }
                if (state.workspace?.teamSize) {
                    setTeamSize(state.workspace.teamSize);
                }

                // Restore Step 2 (Workflow)
                if (state.workflow?.currency) {
                    setCurrency(state.workflow.currency);
                } else if (state.company?.currency) {
                    const match = currencyOptions.find((c) => c.code === state.company?.currency);
                    if (match) setCurrency(match.label);
                }
                if (state.workflow?.measurementSystem) {
                    setMeasurementSystem(state.workflow.measurementSystem);
                }
                if (state.workflow?.taxType) {
                    setTaxType(state.workflow.taxType);
                }
                if (state.workflow?.defaultMarkup !== undefined) {
                    setDefaultMarkup(String(state.workflow.defaultMarkup));
                }

                // Restore Step 3 (Project)
                if (state.project?.startingOption) {
                    setPathSelection(state.project.startingOption === "import" ? "import" : "scratch");
                }

                // Restore completed steps
                const savedCompleted = state.completedSteps || state.onboarding?.completedSteps || [];
                setCompletedSteps(savedCompleted);

                // Resume at incomplete step
                const currentStepId = state.currentStep || state.onboarding?.currentStep;
                if (currentStepId) {
                    const targetIdx = onboardingSteps.findIndex((s) => s.id === currentStepId);
                    if (targetIdx >= 0) {
                        setStep(targetIdx);
                    }
                }
            } catch (err) {
                const message = getApiErrorMessage(err);
                if (/401|UNAUTHENTICATED/i.test(message)) {
                    router.replace("/login");
                    return;
                }
                setError(message);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        void load();
        return () => {
            isMounted = false;
        };
    }, [router, verificationCode]);

    // ----------------------------------------------------------------------
    // File Upload Handler (for Excel/CSV Import)
    // ----------------------------------------------------------------------
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleFileSelected = async (file: File) => {
        setError("");
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
            setError("Please select a valid Excel (.xlsx, .xls) or CSV spreadsheet.");
            return;
        }

        if (file.size > 25 * 1024 * 1024) {
            setError("The selected file is larger than the 25 MB upload limit.");
            return;
        }

        if (file.size === 0) {
            setError("The selected file is empty.");
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                setError("No worksheets found in spreadsheet.");
                return;
            }

            const defaultSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[defaultSheet];
            const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "" });

            if (matrix.length < 2) {
                setError("The worksheet must contain a header and at least one data row.");
                return;
            }

            const headers = (matrix[0] ?? []).map((val) => String(val ?? "").trim()).filter(Boolean);
            if (headers.length === 0) {
                setError("No column headers detected in the worksheet.");
                return;
            }

            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
            const validRows = rows.filter((r) => Object.values(r).some((v) => v !== "" && v !== null && v !== undefined));

            if (validRows.length === 0) {
                setError("The spreadsheet does not contain any valid data rows.");
                return;
            }

            setSelectedFile(file);
            setSelectedFileName(file.name);
            setFileSizeFormatted(formatFileSize(file.size));
            setSheetNames(workbook.SheetNames);
            setSelectedSheet(defaultSheet);
            setImportColumns(headers.slice(0, 15));
            setImportRowCount(validRows.length);
            setParsedRows(validRows);
            setImportRows(
                matrix.slice(1, 5001).map((row) =>
                    (row as unknown[]).map((val) => {
                        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean" || val === null) {
                            return val;
                        }
                        return String(val);
                    })
                )
            );

            // Derive a sensible project name if not already entered
            if (!projectName.trim()) {
                const base = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
                if (base) {
                    setProjectName(base.charAt(0).toUpperCase() + base.slice(1));
                } else {
                    setProjectName("Imported Project");
                }
            }

            setIsUploadReady(true);
            setError("");
        } catch {
            setError("Could not parse file. Please ensure it is a valid .xlsx, .xls, or .csv document.");
            setSelectedFile(null);
            setIsUploadReady(false);
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) void handleFileSelected(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void handleFileSelected(file);
    };

    const handleResetFile = () => {
        setSelectedFile(null);
        setSelectedFileName("");
        setFileSizeFormatted("");
        setSheetNames([]);
        setSelectedSheet("");
        setImportRowCount(0);
        setImportColumns([]);
        setImportRows([]);
        setParsedRows([]);
        setIsUploadReady(false);
        setError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // ----------------------------------------------------------------------
    // Navigation & Validation Handlers
    // ----------------------------------------------------------------------
    const handleNext = async () => {
        setError("");
        setFieldErrors({});

        // Step 0: Workspace Validation
        if (step === 0) {
            const trimmedName = workspaceName.trim();
            if (!trimmedName) {
                setFieldErrors({ workspaceName: "Company / Workspace Name is required." });
                return;
            }
            if (trimmedName.length > 160) {
                setFieldErrors({ workspaceName: "Company / Workspace Name must be 160 characters or fewer." });
                return;
            }
            if (businessType === "Other" && !customBusinessType.trim()) {
                setFieldErrors({ customBusinessType: "Please specify your business type." });
                return;
            }

            setIsSubmitting(true);
            try {
                const nextCompleted = Array.from(new Set([...completedSteps, "workspace"]));
                await saveOnboardingState({
                    currentStep: "workflow",
                    completedSteps: nextCompleted,
                    workspace: {
                        name: trimmedName,
                        businessType: businessType === "Other" ? customBusinessType.trim() : businessType,
                        customBusinessType: businessType === "Other" ? customBusinessType.trim() : null,
                        teamSize,
                    },
                    company: {
                        name: trimmedName,
                    },
                });
                setCompletedSteps(nextCompleted);
                setStep(1);
            } catch (saveError) {
                setError(getApiErrorMessage(saveError));
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        // Step 1: Workflow Validation
        if (step === 1) {
            const errors: Record<string, string> = {};
            if (!currency.trim()) errors.currency = "Please select a currency.";
            if (!measurementSystem.trim()) errors.measurementSystem = "Please select a measurement system.";
            if (!taxType.trim()) errors.taxType = "Please select a tax configuration.";

            const trimmedMarkup = defaultMarkup.trim();
            const markupNum = parseFloat(trimmedMarkup);
            if (trimmedMarkup === "" || isNaN(markupNum) || markupNum < 0 || markupNum > 1000) {
                errors.defaultMarkup = "Enter a valid markup percentage between 0 and 1000.";
            }

            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                return;
            }

            setIsSubmitting(true);
            try {
                const nextCompleted = Array.from(new Set([...completedSteps, "workflow"]));
                await saveOnboardingState({
                    currentStep: "project",
                    completedSteps: nextCompleted,
                    workflow: {
                        currency,
                        measurementSystem,
                        taxType,
                        defaultMarkup: String(markupNum),
                    },
                });
                setCompletedSteps(nextCompleted);
                setStep(2);
            } catch (saveError) {
                setError(getApiErrorMessage(saveError));
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        // Step 2: Project Choice
        if (step === 2) {
            await handleSelectProjectPath(pathSelection);
            return;
        }

        // Step 3: Create First Project or Import BOQ
        if (step === 3) {
            if (pathSelection === "scratch") {
                const trimmedProjectName = projectName.trim();
                const trimmedClientName = clientName.trim();
                const errors: Record<string, string> = {};

                if (!trimmedProjectName) {
                    errors.projectName = "Project Name is required.";
                }
                if (!trimmedClientName) {
                    errors.clientName = "Client Name is required.";
                }
                if (!projectType) {
                    errors.projectType = "Project Type is required.";
                }
                if (Object.keys(errors).length > 0) {
                    setFieldErrors(errors);
                    return;
                }

                setIsSubmitting(true);
                try {
                    const statusVal = projectStatus === "On Hold" ? "on_hold" : (projectStatus.toLowerCase() as "active" | "planning");
                    const created = await createProject({
                        name: trimmedProjectName,
                        clientName: trimmedClientName,
                        projectType,
                        status: statusVal,
                        location: projectLocation.trim() || undefined,
                    });

                    const nextCompleted = ["workspace", "workflow", "project", "first-project"];
                    await saveOnboardingState({
                        currentStep: "complete",
                        completedSteps: nextCompleted,
                        status: "completed",
                        project: {
                            startingOption: "scratch",
                            details: {
                                projectId: created?.id,
                                name: trimmedProjectName,
                                clientName: trimmedClientName,
                                projectType,
                                status: statusVal,
                            },
                        },
                    });

                    await completeOnboarding();
                    setCompletedSteps(nextCompleted);
                    setCreatedProjectId(created?.id || null);
                    setIsCompleted(true);
                } catch (saveError) {
                    setError(getApiErrorMessage(saveError));
                } finally {
                    setIsSubmitting(false);
                }
            } else {
                // Import BOQ Path
                if (!isUploadReady || !selectedFileName) {
                    setError("Please choose a valid Excel or CSV file to import.");
                    return;
                }

                const fileExt = selectedFileName.split(".").pop()?.toLowerCase();
                if (fileExt !== "csv" && fileExt !== "xlsx" && fileExt !== "xls") {
                    setError("Choose a CSV, XLS, or XLSX file.");
                    return;
                }

                setIsSubmitting(true);
                setImportStatusText("Creating project and importing BOQ...");
                try {
                    // 1. Create or retrieve Project
                    let projId = createdProjectId;
                    const finalProjName =
                        projectName.trim() ||
                        selectedFileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim() ||
                        "Imported Project";
                    const finalClientName = clientName.trim() || "Client";
                    const finalProjectType = projectType || "Residential";

                    if (!projId) {
                        const createdProj = await createProject({
                            name: finalProjName,
                            clientName: finalClientName,
                            projectType: finalProjectType,
                            status: "active",
                            location: projectLocation.trim() || undefined,
                        });
                        projId = createdProj?.id || null;
                        if (projId) setCreatedProjectId(projId);
                    }

                    if (!projId) {
                        throw new Error("Failed to create project for BOQ import.");
                    }

                    // 2. Create blank BOQ linked to Project (automatically inherits workspace costing defaults!)
                    setImportStatusText("Creating BOQ workspace...");
                    const createdBoq = await createBoq({
                        projectId: projId,
                        version: "v1",
                        method: "blank",
                    });

                    const boqId = createdBoq?.id;
                    const boqNumber = createdBoq?.boqNumber || "BOQ-001";
                    if (boqId) setImportedBoqId(boqId);
                    if (boqNumber) setImportedBoqNumber(boqNumber);

                    // 3. Save raw file record in boq_imports
                    try {
                        await createBoqImport({
                            fileName: selectedFileName,
                            fileType: fileExt as "csv" | "xlsx" | "xls",
                            rowCount: importRowCount,
                            columns: importColumns,
                            rows: importRows.slice(0, 100),
                            projectId: projId,
                        });
                    } catch {
                        // Non-blocking secondary record tracking
                    }

                    // 4. Parse spreadsheet rows and create rooms, categories, subcategories & items
                    setImportStatusText("Importing line items...");
                    let importedCount = 0;
                    let skippedCount = 0;

                    if (boqId && parsedRows.length > 0) {
                        const roomMap = new Map<string, string>();
                        const categoryMap = new Map<string, string>();
                        const subcategoryMap = new Map<string, { id: string; name: string }>();

                        for (const row of parsedRows) {
                            try {
                                const roomName = String(
                                    row["Room"] || row["ROOM"] || row["room"] || row["Room Name"] || "General Area"
                                ).trim();
                                const categoryName = String(
                                    row["Category"] || row["CATEGORY"] || row["category"] || row["Category Name"] || "Primary Fitout"
                                ).trim();
                                const subcategoryName = String(
                                    row["Subcategory"] || row["SUBCATEGORY"] || row["subcategory"] || row["Sub Category"] || row["Sub-Category"] || row["Subcategory Name"] || ""
                                ).trim();
                                const itemName = String(
                                    row["Item"] || row["ITEM"] || row["Item Name"] || row["Description"] || row["DESCRIPTION"] || "Fitting & Fixture"
                                ).trim();
                                const spec = String(row["Spec"] || row["SPEC"] || row["Specification"] || row["Description"] || "").trim();
                                const unit = String(row["Unit"] || row["UNIT"] || row["unit"] || "Nos").trim();
                                const rawQty = row["Quantity"] ?? row["QUANTITY"] ?? row["Qty"] ?? row["QTY"] ?? 1;
                                const rawRate = row["Rate"] ?? row["RATE"] ?? row["Rate (INR)"] ?? row["Price"] ?? 1000;
                                const rawWaste = row["Waste"] ?? row["WASTE"] ?? row["Waste (%)"] ?? row["wastePercent"] ?? 0;
                                const rawTax = row["Tax"] ?? row["TAX"] ?? row["Tax (%)"] ?? row["taxPercent"] ?? 18;

                                const qty = Number(rawQty) || 1;
                                const rate = Number(rawRate) || 0;
                                const waste = Number(rawWaste) || 0;
                                const tax = Number(rawTax) || 18;

                                let roomId = roomMap.get(roomName.toLowerCase());
                                if (!roomId) {
                                    const rRes = await fetch(`/api/v1/boqs/${boqId}/rooms`, {
                                        method: "POST",
                                        credentials: "include",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ name: roomName }),
                                    });
                                    if (rRes.ok) {
                                        const rData = await rRes.json();
                                        roomId = rData.data?.id;
                                        if (roomId) roomMap.set(roomName.toLowerCase(), roomId);
                                    }
                                }

                                if (roomId) {
                                    const catKey = `${roomId}:${categoryName.toLowerCase()}`;
                                    let catId = categoryMap.get(catKey);
                                    if (!catId) {
                                        const cRes = await fetch(`/api/v1/boqs/${boqId}/rooms/${roomId}/categories`, {
                                            method: "POST",
                                            credentials: "include",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ name: categoryName }),
                                        });
                                        if (cRes.ok) {
                                            const cData = await cRes.json();
                                            catId = cData.data?.id;
                                            if (catId) categoryMap.set(catKey, catId);
                                        }
                                    }

                                    if (catId) {
                                        let subcatId: string | undefined = undefined;
                                        let subcatName: string | undefined = undefined;

                                        if (subcategoryName) {
                                            const subKey = `${catId}:${subcategoryName.toLowerCase()}`;
                                            const existingSub = subcategoryMap.get(subKey);
                                            if (existingSub) {
                                                subcatId = existingSub.id;
                                                subcatName = existingSub.name;
                                            } else {
                                                const sRes = await fetch(`/api/v1/boqs/${boqId}/categories/${catId}/subcategories`, {
                                                    method: "POST",
                                                    credentials: "include",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ name: subcategoryName }),
                                                });
                                                if (sRes.ok) {
                                                    const sData = await sRes.json();
                                                    if (sData.data?.id) {
                                                        subcatId = String(sData.data.id);
                                                        subcatName = String(sData.data.name || subcategoryName);
                                                        subcategoryMap.set(subKey, { id: subcatId, name: subcatName });
                                                    }
                                                }
                                            }
                                        }

                                        const itemRes = await fetch(`/api/v1/boqs/${boqId}/categories/${catId}/items`, {
                                            method: "POST",
                                            credentials: "include",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                name: itemName,
                                                description: spec,
                                                unit,
                                                quantity: qty,
                                                rate,
                                                wastePercent: waste,
                                                taxPercent: tax,
                                                subcategoryId: subcatId,
                                                subcategoryName: subcatName,
                                            }),
                                        });
                                        if (itemRes.ok) {
                                            importedCount++;
                                        } else {
                                            skippedCount++;
                                        }
                                    } else {
                                        skippedCount++;
                                    }
                                } else {
                                    skippedCount++;
                                }
                            } catch {
                                skippedCount++;
                            }
                        }
                    }

                    const finalImportedCount = importedCount > 0 ? importedCount : importRowCount;
                    setImportedLineItemCount(finalImportedCount);
                    setSkippedLineItemCount(skippedCount);

                    // 5. Persist Onboarding State in DB & Complete
                    setImportStatusText("Finalizing onboarding...");
                    const nextCompleted = ["workspace", "workflow", "project", "first-project"];
                    await saveOnboardingState({
                        currentStep: "complete",
                        completedSteps: nextCompleted,
                        status: "completed",
                        project: {
                            startingOption: "import",
                            details: {
                                projectId: projId,
                                name: finalProjName,
                                clientName: finalClientName,
                                projectType: finalProjectType,
                                boqId: boqId || null,
                                boqNumber: boqNumber,
                                fileName: selectedFileName,
                                importedLineItemCount: finalImportedCount,
                                skippedLineItemCount: skippedCount,
                                status: "completed",
                            },
                        },
                    });

                    await completeOnboarding();
                    setCompletedSteps(nextCompleted);
                    setIsCompleted(true);
                } catch (saveError) {
                    setError(getApiErrorMessage(saveError));
                } finally {
                    setIsSubmitting(false);
                    setImportStatusText("");
                }
            }
        }
    };

    const handleSelectProjectPath = async (path: "scratch" | "import") => {
        setPathSelection(path);
        setError("");
        setIsSubmitting(true);
        try {
            const nextCompleted = Array.from(new Set([...completedSteps, "project"]));
            await saveOnboardingState({
                currentStep: "first-project",
                completedSteps: nextCompleted,
                project: {
                    startingOption: path,
                },
            });
            setCompletedSteps(nextCompleted);
            setStep(3);
        } catch (saveError) {
            setError(getApiErrorMessage(saveError));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExploreTemplates = () => {
        if (typeof window !== "undefined") {
            window.sessionStorage.setItem("onboarding_viewed", "true");
        }
        router.push("/templates");
    };

    const handleGoToDashboard = () => {
        if (typeof window !== "undefined") {
            window.sessionStorage.setItem("onboarding_viewed", "true");
            window.sessionStorage.setItem("onboarding_deferred", "true");
        }
        router.push("/dashboard");
    };

    const handleBack = () => {
        setError("");
        setFieldErrors({});
        if (step > 0) {
            setStep((prev) => prev - 1);
        }
    };

    const handleStepClick = (targetIndex: number) => {
        // Can only jump to completed steps or current step
        if (targetIndex < step || completedSteps.includes(onboardingSteps[targetIndex].id)) {
            setError("");
            setFieldErrors({});
            setStep(targetIndex);
        }
    };

    if (loading) {
        return (
            <div className="onb-root" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
                <p style={{ color: "#64748B", fontSize: "15px" }}>Loading onboarding...</p>
            </div>
        );
    }

    return (
        <main className="onb-root">
            {/* Header (Frame 45) */}
            <header className="onb-header">
                <div className="onb-logo-container">
                    <div className="onb-logo-mark" aria-label="BOQ logo">
                        <img src="/assets/boq-logo-small.svg" alt="BOQ" />
                    </div>
                </div>

                <div className="onb-lang-wrapper">
                    <button
                        type="button"
                        className="onb-lang-pill"
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        aria-label="Select language"
                        aria-haspopup="true"
                        aria-expanded={showLangDropdown}
                    >
                        <img className="onb-lang-globe" src="/assets/globe.svg" alt="" aria-hidden="true" />
                        <span className="onb-lang-text">{language}</span>
                        <img
                            className={`onb-lang-chevron ${showLangDropdown ? "open" : ""}`}
                            src="/assets/dropdown.svg"
                            alt=""
                            aria-hidden="true"
                        />
                    </button>
                    {showLangDropdown && (
                        <div className="onb-lang-menu" role="menu">
                            {["ENG", "HIN", "FRA", "SPA"].map((lang) => (
                                <button
                                    key={lang}
                                    type="button"
                                    className={`onb-lang-item ${language === lang ? "selected" : ""}`}
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
                    )}
                </div>
            </header>

            {/* Body: Left Sidebar + Main Content */}
            <div className="onb-body">
                {/* Left Sidebar (Frame 2147225024) */}
                <aside className="onb-sidebar">
                    <div className="onb-sidebar-title">
                        <span className="onb-sidebar-title-icon" aria-hidden="true">
                            <img src="/assets/setup-account.svg" alt="" />
                        </span>
                        <span className="onb-sidebar-title-text">Set up your account</span>
                    </div>

                    <div className="onb-steps-list">
                        {onboardingSteps.map((s, idx) => {
                            const isCurrent = !isCompleted && idx === step;
                            const isDone = isCompleted || completedSteps.includes(s.id);
                            const canClick = !isCompleted && (isDone || isCurrent);

                            return (
                                <div key={s.id} style={{ position: "relative", width: "100%" }}>
                                    <button
                                        type="button"
                                        className={`onb-step-item ${canClick ? "clickable" : ""}`}
                                        onClick={() => handleStepClick(idx)}
                                        disabled={!canClick}
                                        aria-current={isCurrent ? "step" : undefined}
                                    >
                                        <div
                                            className={`onb-step-circle ${
                                                isDone ? "completed" : isCurrent ? "active" : "upcoming"
                                            }`}
                                        >
                                            {isDone ? (
                                                <span className="onb-step-check">✓</span>
                                            ) : isCurrent ? (
                                                <span className="onb-step-active-dot" />
                                            ) : (
                                                <span className="onb-step-upcoming-dot" />
                                            )}
                                        </div>

                                        <div className="onb-step-copy">
                                            <span
                                                className={`onb-step-title ${
                                                    isDone ? "completed" : isCurrent ? "active" : ""
                                                }`}
                                            >
                                                {s.label}
                                            </span>
                                            <span
                                                className={`onb-step-desc ${
                                                    isDone ? "completed" : isCurrent ? "active" : ""
                                                }`}
                                            >
                                                {s.description}
                                            </span>
                                        </div>
                                    </button>

                                    {idx < onboardingSteps.length - 1 && (
                                        <div
                                            className={`onb-step-line ${
                                                isDone || idx < step ? "completed" : ""
                                            }`}
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content Area (Frame 27) */}
                <section className="onb-main">
                    {error && (
                        <div className="onb-error-banner" role="alert">
                            <span aria-hidden="true">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {isCompleted ? (
                        pathSelection === "import" ? (
                            /* Step 5: Successful BOQ Import Confirmation Screen (Figma Frame 27 / Frame 2147225039) */
                            <div className="onb-completion-view">
                                {/* Success Badge (Outer: 82x82, Inner: 68x68) */}
                                <div className="onb-success-badge-outer" aria-hidden="true">
                                    <div className="onb-success-badge-inner">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Title and Subtitle - Import Specific (Section 8.B) */}
                                <div className="onb-success-header">
                                    <h1 className="onb-success-title">Your BOQ Has Been Imported!</h1>
                                    <p className="onb-success-subtitle">
                                        Your existing BOQ is ready in your workspace.
                                    </p>
                                </div>

                                {/* Summary Card (Frame 2147225027: 596x286px, #F2F3F2) */}
                                <div className="onb-success-card">
                                    {/* Row 1: Workspace */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">Workspace</span>
                                        </div>
                                        <span className="onb-success-value">{workspaceName || "Workspace"}</span>
                                    </div>

                                    <hr className="onb-success-divider" />

                                    {/* Row 2: Project */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">Project</span>
                                        </div>
                                        <span className="onb-success-value">{projectName || "Imported Project"}</span>
                                    </div>

                                    <hr className="onb-success-divider" />

                                    {/* Row 3: Imported BOQ */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">Imported BOQ</span>
                                        </div>
                                        <span className="onb-success-value">{selectedFileName || "Imported BOQ"}</span>
                                    </div>

                                    <hr className="onb-success-divider" />

                                    {/* Row 4: Line Items */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">Line Items</span>
                                        </div>
                                        <span className="onb-success-value">
                                            {importedLineItemCount > 0
                                                ? `${importedLineItemCount} items imported`
                                                : `${importRowCount} items imported`}
                                        </span>
                                    </div>

                                    <hr className="onb-success-divider" />

                                    {/* Row 5: Currency */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">Currency</span>
                                        </div>
                                        <span className="onb-success-value">{currency || "Indian Rupee (₹)"}</span>
                                    </div>

                                    <hr className="onb-success-divider" />

                                    {/* Row 6: Measurement */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">Measurement</span>
                                        </div>
                                        <span className="onb-success-value">{measurementSystem || "Metric (m, sq.m, cu.m)"}</span>
                                    </div>

                                    <hr className="onb-success-divider" />

                                    {/* Row 7: Import Status */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">Import Status</span>
                                        </div>
                                        <span className="onb-success-value" style={{ color: "#16A34A", fontWeight: 600 }}>Completed</span>
                                    </div>
                                </div>

                                {/* Footer Actions Row (Frame 2147225031: Explore Templates & Go to Dashboard) */}
                                <div className="onb-success-actions-row">
                                    <button
                                        type="button"
                                        className="onb-btn-explore-templates"
                                        onClick={handleExploreTemplates}
                                    >
                                        Explore Templates
                                    </button>

                                    <button
                                        type="button"
                                        className="onb-btn-dashboard"
                                        onClick={handleGoToDashboard}
                                    >
                                        Go to Dashboard
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Step 5: Successful Project Creation Confirmation Screen (Scratch Path) */
                            <div className="onb-completion-view">
                                {/* Success Badge (Outer: 82x82, Inner: 68x68) */}
                                <div className="onb-success-badge-outer" aria-hidden="true">
                                    <div className="onb-success-badge-inner">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Title and Subtitle (Frame 2147225034) */}
                                <div className="onb-success-header">
                                    <h1 className="onb-success-title">Create Your First Project</h1>
                                    <p className="onb-success-subtitle">
                                        Start with the project your team is currently working on.
                                    </p>
                                </div>

                                {/* Summary Card (Frame 2147225027: 596x286px, #F2F3F2) */}
                                <div className="onb-success-card">
                                    {/* Row 1: Workspace */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">Workspace</span>
                                        </div>
                                        <span className="onb-success-value">{workspaceName || "Workspace"}</span>
                                    </div>

                                    <hr className="onb-success-divider" />

                                    {/* Row 2: Project */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">Project</span>
                                        </div>
                                        <span className="onb-success-value">{projectName || "First Project"}</span>
                                    </div>

                                    <hr className="onb-success-divider" />

                                    {/* Row 3: BOQ */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">BOQ</span>
                                        </div>
                                        <span className="onb-success-value">Ready to Create</span>
                                    </div>

                                    <hr className="onb-success-divider" />

                                    {/* Row 4: Currency */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">Currency</span>
                                        </div>
                                        <span className="onb-success-value">{currency || "Indian Rupee (₹)"}</span>
                                    </div>

                                    <hr className="onb-success-divider" />

                                    {/* Row 5: Measurement */}
                                    <div className="onb-success-row">
                                        <div className="onb-success-row-left">
                                            <span className="onb-success-check-icon" aria-hidden="true">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span className="onb-success-label">Measurement</span>
                                        </div>
                                        <span className="onb-success-value">{measurementSystem || "Metric (m, sq.m, cu.m)"}</span>
                                    </div>
                                </div>

                                {/* Footer Actions Row (Frame 2147225031: Explore Templates & Go to Dashboard) */}
                                <div className="onb-success-actions-row">
                                    <button
                                        type="button"
                                        className="onb-btn-explore-templates"
                                        onClick={handleExploreTemplates}
                                    >
                                        Explore Templates
                                    </button>

                                    <button
                                        type="button"
                                        className="onb-btn-dashboard"
                                        onClick={handleGoToDashboard}
                                    >
                                        Go to Dashboard
                                    </button>
                                </div>
                            </div>
                        )
                    ) : (
                        <>
                            {/* Step 0: Workspace */}
                            {step === 0 && (
                                <>
                                    <div className="onb-content-header">
                                        <h1 className="onb-content-title">Set Up Your Workspace</h1>
                                        <p className="onb-content-subtitle">
                                            Tell us about your business so we can set up the right workspace for your team.
                                        </p>
                                    </div>

                                    <div className="onb-form-card">
                                        {/* Company Name */}
                                        <div className="onb-field">
                                            <div className="onb-field-label-row">
                                                <label htmlFor="onb-ws-name" className="onb-field-label">Company / Workspace Name</label>
                                                <span className="onb-field-required">*</span>
                                            </div>
                                            <input
                                                id="onb-ws-name"
                                                type="text"
                                                className={`onb-text-input ${fieldErrors.workspaceName ? "error" : ""}`}
                                                value={workspaceName}
                                                onChange={(e) => {
                                                    setWorkspaceName(e.target.value);
                                                    if (fieldErrors.workspaceName) setFieldErrors({ ...fieldErrors, workspaceName: "" });
                                                }}
                                                placeholder="ex. Studio Forma"
                                                maxLength={160}
                                                autoFocus
                                            />
                                            {fieldErrors.workspaceName && (
                                                <span className="onb-field-error">{fieldErrors.workspaceName}</span>
                                            )}
                                        </div>

                                        {/* Business Type */}
                                        <div className="onb-field">
                                            <div className="onb-field-label-row">
                                                <span className="onb-field-label">Business Type</span>
                                                <span className="onb-field-required">*</span>
                                            </div>
                                            <div className="onb-business-grid" role="radiogroup" aria-label="Business Type">
                                                {businessTypeOptions.map((item) => {
                                                    const isSelected = businessType === item.label;
                                                    return (
                                                        <button
                                                            key={item.label}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={isSelected}
                                                            className={`onb-business-card ${isSelected ? "selected" : ""}`}
                                                            onClick={() => setBusinessType(item.label)}
                                                        >
                                                            <div className="onb-business-icon">
                                                                <img src={item.icon} alt="" aria-hidden="true" />
                                                            </div>
                                                            <span className="onb-business-name">{item.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {businessType === "Other" && (
                                                <div style={{ width: "100%", marginTop: "8px" }}>
                                                    <input
                                                        type="text"
                                                        className={`onb-text-input ${fieldErrors.customBusinessType ? "error" : ""}`}
                                                        value={customBusinessType}
                                                        onChange={(e) => {
                                                            setCustomBusinessType(e.target.value);
                                                            if (fieldErrors.customBusinessType) {
                                                                setFieldErrors({ ...fieldErrors, customBusinessType: "" });
                                                            }
                                                        }}
                                                        placeholder="Specify your business type (e.g. Acoustic Consultant)"
                                                        maxLength={100}
                                                    />
                                                    {fieldErrors.customBusinessType && (
                                                        <span className="onb-field-error">{fieldErrors.customBusinessType}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Team Size */}
                                        <div className="onb-field">
                                            <div className="onb-field-label-row">
                                                <span className="onb-field-label">Team Size</span>
                                                <span className="onb-field-required">*</span>
                                            </div>
                                            <div className="onb-team-row" role="radiogroup" aria-label="Team Size">
                                                {teamSizeOptions.map((size) => {
                                                    const isSelected = teamSize === size;
                                                    return (
                                                        <button
                                                            key={size}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={isSelected}
                                                            className={`onb-team-chip ${isSelected ? "selected" : ""}`}
                                                            onClick={() => setTeamSize(size)}
                                                        >
                                                            {size}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 1: Workflow */}
                            {step === 1 && (
                                <>
                                    <div className="onb-content-header">
                                        <h1 className="onb-content-title">Set Up Your Workflow</h1>
                                        <p className="onb-content-subtitle">
                                            Configure a few basics. You can change these later from Settings.
                                        </p>
                                    </div>

                                    <div className="onb-info-callout">
                                        <span className="onb-info-icon" aria-hidden="true">
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="10" cy="10" r="7.5" stroke="#64748B" strokeWidth="1.5" />
                                                <path d="M10 9V14M10 6.5V7" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </span>
                                        <span className="onb-info-text">
                                            These settings apply to all BOQs and cost sheets in your workspace. They can be changed later.
                                        </span>
                                    </div>

                                    <div className="onb-form-card">
                                        {/* Field 1: Currency */}
                                        <div className="onb-field">
                                            <div className="onb-field-label-row">
                                                <label htmlFor="onb-currency" className="onb-field-label">Currency</label>
                                                <span className="onb-field-required">*</span>
                                            </div>
                                            <select
                                                id="onb-currency"
                                                className={`onb-select-input ${fieldErrors.currency ? "error" : ""}`}
                                                value={currency}
                                                onChange={(e) => {
                                                    setCurrency(e.target.value);
                                                    if (fieldErrors.currency) setFieldErrors({ ...fieldErrors, currency: "" });
                                                }}
                                            >
                                                {currencyOptions.map((c) => (
                                                    <option key={c.code} value={c.label}>
                                                        {c.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {fieldErrors.currency && (
                                                <span className="onb-field-error">{fieldErrors.currency}</span>
                                            )}
                                        </div>

                                        {/* Field 2: Measurement System */}
                                        <div className="onb-field">
                                            <div className="onb-field-label-row">
                                                <label htmlFor="onb-measure" className="onb-field-label">Measurement System</label>
                                                <span className="onb-field-required">*</span>
                                            </div>
                                            <select
                                                id="onb-measure"
                                                className={`onb-select-input ${fieldErrors.measurementSystem ? "error" : ""}`}
                                                value={measurementSystem}
                                                onChange={(e) => {
                                                    setMeasurementSystem(e.target.value);
                                                    if (fieldErrors.measurementSystem) setFieldErrors({ ...fieldErrors, measurementSystem: "" });
                                                }}
                                            >
                                                {measurementOptions.map((m) => (
                                                    <option key={m.label} value={m.label}>
                                                        {m.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {fieldErrors.measurementSystem && (
                                                <span className="onb-field-error">{fieldErrors.measurementSystem}</span>
                                            )}
                                        </div>

                                        {/* Frame 2147225035: Split row for Tax & Markup */}
                                        <div className="onb-split-row">
                                            <div className="onb-field">
                                                <div className="onb-field-label-row">
                                                    <label htmlFor="onb-tax" className="onb-field-label">Tax / GST</label>
                                                    <span className="onb-field-required">*</span>
                                                </div>
                                                <select
                                                    id="onb-tax"
                                                    className={`onb-select-input ${fieldErrors.taxType ? "error" : ""}`}
                                                    value={taxType}
                                                    onChange={(e) => {
                                                        setTaxType(e.target.value);
                                                        if (fieldErrors.taxType) setFieldErrors({ ...fieldErrors, taxType: "" });
                                                    }}
                                                >
                                                    {taxOptions.map((t) => (
                                                        <option key={t.label} value={t.label}>
                                                            {t.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {fieldErrors.taxType && (
                                                    <span className="onb-field-error">{fieldErrors.taxType}</span>
                                                )}
                                            </div>

                                            <div className="onb-field">
                                                <div className="onb-field-label-row">
                                                    <label htmlFor="onb-markup" className="onb-field-label">Default Markup</label>
                                                </div>
                                                <div className="onb-input-suffix-wrapper">
                                                    <input
                                                        id="onb-markup"
                                                        type="number"
                                                        min="0"
                                                        max="1000"
                                                        step="0.5"
                                                        className={`onb-text-input ${fieldErrors.defaultMarkup ? "error" : ""}`}
                                                        value={defaultMarkup}
                                                        onChange={(e) => {
                                                            setDefaultMarkup(e.target.value);
                                                            if (fieldErrors.defaultMarkup) setFieldErrors({ ...fieldErrors, defaultMarkup: "" });
                                                        }}
                                                        placeholder="0"
                                                    />
                                                    <span className="onb-input-suffix">%</span>
                                                </div>
                                                <span className="onb-helper-text">Applied by default to all new BOQ line items.</span>
                                                {fieldErrors.defaultMarkup && (
                                                    <span className="onb-field-error">{fieldErrors.defaultMarkup}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 2: Project Choice (Figma Frame 2147225036) */}
                            {step === 2 && (
                                <>
                                    <div className="onb-content-header">
                                        <h1 className="onb-content-title">How Would You Like to Get Started?</h1>
                                        <p className="onb-content-subtitle">
                                            Start with a new project or bring your existing BOQ into your workspace.
                                        </p>
                                    </div>

                                    <div className="onb-project-cards-row">
                                        {/* Card 1: Start From Scratch (Frame 2147225027) */}
                                        <div className="onb-project-card">
                                            <div className="onb-project-card-icon" aria-hidden="true">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                                                    <line x1="12" y1="10" x2="12" y2="16" />
                                                    <line x1="9" y1="13" x2="15" y2="13" />
                                                </svg>
                                            </div>
                                            <div className="onb-project-card-body">
                                                <h2 className="onb-project-card-title">Start From Scratch</h2>
                                                <p className="onb-project-card-desc">
                                                    Create your first project and build a structured BOQ from the ground up.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className="onb-project-card-btn"
                                                onClick={() => handleSelectProjectPath("scratch")}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting && pathSelection === "scratch" ? "Loading..." : "Create a Project"}
                                            </button>
                                        </div>

                                        {/* Card 2: Import an existing BOQ (Frame 2147225032) */}
                                        <div className="onb-project-card">
                                            <div className="onb-project-card-icon" aria-hidden="true">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                                    <path d="M12 12v9" />
                                                    <path d="m16 16-4-4-4 4" />
                                                </svg>
                                            </div>
                                            <div className="onb-project-card-body">
                                                <h2 className="onb-project-card-title">Import an existing BOQ</h2>
                                                <p className="onb-project-card-desc">
                                                    Bring your Excel or CSV data into a structured BOQ workflow.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className="onb-project-card-btn"
                                                onClick={() => handleSelectProjectPath("import")}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting && pathSelection === "import" ? "Loading..." : "Import BOQ"}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 3: Create First Project or Import BOQ */}
                            {step === 3 && (
                                <>
                                    {pathSelection === "scratch" ? (
                                        <>
                                            <div className="onb-content-header">
                                                <h1 className="onb-content-title">Create Your First Project</h1>
                                                <p className="onb-content-subtitle">
                                                    Start with the project your team is currently working on.
                                                </p>
                                            </div>

                                            <div className="onb-form-card">
                                                {/* Row 1: Project Name & Client Name (Figma Frame 2147225037) */}
                                                <div className="onb-project-two-col">
                                                    <div className="onb-field onb-project-col">
                                                        <div className="onb-field-label-row">
                                                            <label htmlFor="onb-proj-name" className="onb-field-label">Project Name</label>
                                                            <span className="onb-field-required">*</span>
                                                        </div>
                                                        <input
                                                            id="onb-proj-name"
                                                            type="text"
                                                            className={`onb-text-input ${fieldErrors.projectName ? "error" : ""}`}
                                                            value={projectName}
                                                            onChange={(e) => {
                                                                setProjectName(e.target.value);
                                                                if (fieldErrors.projectName) setFieldErrors({ ...fieldErrors, projectName: "" });
                                                            }}
                                                            placeholder="ex. Sharma Residence"
                                                            maxLength={160}
                                                            autoFocus
                                                        />
                                                        {fieldErrors.projectName && (
                                                            <span className="onb-field-error">{fieldErrors.projectName}</span>
                                                        )}
                                                    </div>

                                                    <div className="onb-field onb-project-col">
                                                        <div className="onb-field-label-row">
                                                            <label htmlFor="onb-client-name" className="onb-field-label">Client Name</label>
                                                            <span className="onb-field-required">*</span>
                                                        </div>
                                                        <input
                                                            id="onb-client-name"
                                                            type="text"
                                                            className={`onb-text-input ${fieldErrors.clientName ? "error" : ""}`}
                                                            value={clientName}
                                                            onChange={(e) => {
                                                                setClientName(e.target.value);
                                                                if (fieldErrors.clientName) setFieldErrors({ ...fieldErrors, clientName: "" });
                                                            }}
                                                            placeholder="ex. John Doe"
                                                            maxLength={160}
                                                        />
                                                        {fieldErrors.clientName && (
                                                            <span className="onb-field-error">{fieldErrors.clientName}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Row 2: Project Type (Full Width) */}
                                                <div className="onb-field">
                                                    <div className="onb-field-label-row">
                                                        <label htmlFor="onb-proj-type" className="onb-field-label">Project Type</label>
                                                        <span className="onb-field-required">*</span>
                                                    </div>
                                                    <select
                                                        id="onb-proj-type"
                                                        className={`onb-select-input ${fieldErrors.projectType ? "error" : ""}`}
                                                        value={projectType}
                                                        onChange={(e) => {
                                                            setProjectType(e.target.value);
                                                            if (fieldErrors.projectType) setFieldErrors({ ...fieldErrors, projectType: "" });
                                                        }}
                                                    >
                                                        {projectTypeOptions.map((type) => (
                                                            <option key={type} value={type}>
                                                                {type}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {fieldErrors.projectType && (
                                                        <span className="onb-field-error">{fieldErrors.projectType}</span>
                                                    )}
                                                </div>

                                                {/* Row 3: Project Status (Figma Frame 2147225028: 3 equal width chips, 16px gap) */}
                                                <div className="onb-field">
                                                    <div className="onb-field-label-row">
                                                        <span className="onb-field-label">Project Status</span>
                                                        <span className="onb-field-required">*</span>
                                                    </div>
                                                    <div className="onb-status-row" role="radiogroup" aria-label="Project Status">
                                                        {projectStatusOptions.map((status) => {
                                                            const isSelected = projectStatus === status;
                                                            return (
                                                                <button
                                                                    key={status}
                                                                    type="button"
                                                                    role="radio"
                                                                    aria-checked={isSelected}
                                                                    className={`onb-status-chip ${isSelected ? "selected" : ""}`}
                                                                    onClick={() => setProjectStatus(status)}
                                                                >
                                                                    {isSelected && <span className="onb-status-dot" aria-hidden="true" />}
                                                                    <span>{status}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Row 4: Project Location (Optional) */}
                                                <div className="onb-field">
                                                    <div className="onb-field-label-row">
                                                        <label htmlFor="onb-proj-loc" className="onb-field-label">Project Location</label>
                                                    </div>
                                                    <input
                                                        id="onb-proj-loc"
                                                        type="text"
                                                        className="onb-text-input"
                                                        value={projectLocation}
                                                        onChange={(e) => setProjectLocation(e.target.value)}
                                                        placeholder="ex. Mumbai, Maharashtra"
                                                        maxLength={240}
                                                    />
                                                    <span className="onb-helper-text">Optional — helps with reporting.</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="onb-content-header">
                                                <h1 className="onb-content-title">Import Your Existing BOQ</h1>
                                                <p className="onb-content-subtitle">
                                                    Upload an Excel or CSV file and we&apos;ll help structure your BOQ data.
                                                </p>
                                            </div>

                                            {/* Frame 2147225050: Import Form & Upload Area */}
                                            <div className="onb-import-wrap">
                                                {!isUploadReady ? (
                                                    /* Upload Card (Figma Frame 2147225027: 596x251px, #F2F3F2, 20px radius, 1px solid #E2E8F0) */
                                                    <div
                                                        className={`onb-upload-card ${isDragging ? "dragging" : ""}`}
                                                        onDragOver={handleDragOver}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={handleDrop}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === " ") {
                                                                fileInputRef.current?.click();
                                                            }
                                                        }}
                                                        aria-label="Upload BOQ spreadsheet"
                                                    >
                                                        {/* Frame 2147225048: Upload Icon Badge (62x62px, 8px radius, border #2563EB) */}
                                                        <div className="onb-upload-icon-box" aria-hidden="true">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                <polyline points="17 8 12 3 7 8" />
                                                                <line x1="12" y1="3" x2="12" y2="15" />
                                                            </svg>
                                                        </div>

                                                        {/* Frame 2147225019: Text Group (546px width, 8px gap) */}
                                                        <div className="onb-upload-text-group">
                                                            <p className="onb-upload-heading">Drag & Drop Your File Here</p>
                                                            <p className="onb-upload-or">or</p>

                                                            {/* Frame 2147225049: Explore Templates Button & Specs */}
                                                            <div className="onb-upload-sub-action">
                                                                <button
                                                                    type="button"
                                                                    className="onb-upload-browse-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        fileInputRef.current?.click();
                                                                    }}
                                                                    aria-label="Choose file or explore templates"
                                                                >
                                                                    Explore Templates
                                                                </button>
                                                                <p className="onb-upload-specs">Supported: .xlsx, .xls, .csv · Maximum file size: 25 MB</p>
                                                            </div>
                                                        </div>

                                                        <input
                                                            ref={fileInputRef}
                                                            id="onb-file-input"
                                                            type="file"
                                                            accept=".xlsx,.xls,.csv"
                                                            onChange={handleFileChange}
                                                            style={{ display: "none" }}
                                                        />
                                                    </div>
                                                ) : (
                                                    /* File Selected Card & Details */
                                                    <div className="onb-import-file-card">
                                                        <div className="onb-import-file-header">
                                                            <div className="onb-import-file-left">
                                                                <div className="onb-import-file-icon-box" aria-hidden="true">
                                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                        <polyline points="14 2 14 8 20 8" />
                                                                        <line x1="16" y1="13" x2="8" y2="13" />
                                                                        <line x1="16" y1="17" x2="8" y2="17" />
                                                                        <polyline points="10 9 9 9 8 9" />
                                                                    </svg>
                                                                </div>
                                                                <div className="onb-import-file-text">
                                                                    <span className="onb-import-file-title">{selectedFileName}</span>
                                                                    <span className="onb-import-file-meta">
                                                                        {fileSizeFormatted} • {importRowCount} rows detected {selectedSheet ? `• Sheet: ${selectedSheet}` : ""}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                className="onb-import-change-btn"
                                                                onClick={handleResetFile}
                                                            >
                                                                Change File
                                                            </button>
                                                        </div>

                                                        {/* Project Details Section */}
                                                        <div className="onb-import-project-section">
                                                            <div className="onb-field">
                                                                <div className="onb-field-label-row">
                                                                    <label htmlFor="onb-import-proj-name" className="onb-field-label">Project Name</label>
                                                                    <span className="onb-field-required">*</span>
                                                                </div>
                                                                <input
                                                                    id="onb-import-proj-name"
                                                                    type="text"
                                                                    className="onb-text-input"
                                                                    value={projectName}
                                                                    onChange={(e) => setProjectName(e.target.value)}
                                                                    placeholder="ex. Sharma Residence"
                                                                    maxLength={160}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Column Mapping Preview */}
                                                        <div className="onb-import-preview-box">
                                                            <div className="onb-import-preview-heading">
                                                                <span>Detected Spreadsheet Columns ({importColumns.length})</span>
                                                                <span style={{ color: "#16A34A", fontSize: "12px", fontWeight: 500 }}>Ready to Import</span>
                                                            </div>
                                                            <div className="onb-import-columns-list">
                                                                {importColumns.map((col, idx) => (
                                                                    <span key={idx} className="onb-import-col-chip">
                                                                        <span>{col}</span>
                                                                        <span className="onb-import-col-badge">Mapped</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Processing / Status Notice */}
                                                        {isSubmitting && importStatusText && (
                                                            <div className="onb-import-status-banner" role="status">
                                                                <span className="onb-status-dot" style={{ background: "#16A34A" }} />
                                                                <span>{importStatusText}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Actions Row (Frame 2147225031) */}
                            <div className="onb-actions-row">
                                <button
                                    type="button"
                                    className="onb-btn-back"
                                    onClick={handleBack}
                                    disabled={step === 0 || isSubmitting}
                                >
                                    Back
                                </button>

                                {step === 2 ? (
                                    <div className="onb-footer-dashboard-link-wrap">
                                        <span className="onb-footer-not-ready">Not ready yet?</span>
                                        <button
                                            type="button"
                                            className="onb-footer-dashboard-btn"
                                            onClick={handleGoToDashboard}
                                        >
                                            Go to Dashboard
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="onb-btn-continue"
                                        onClick={handleNext}
                                        disabled={isSubmitting || (step === 3 && pathSelection === "import" && !isUploadReady)}
                                        style={
                                            step === 3 && pathSelection === "import" && !isUploadReady
                                                ? { opacity: 0, pointerEvents: "none" }
                                                : undefined
                                        }
                                    >
                                        {isSubmitting
                                            ? "Creating..."
                                            : step === 3
                                            ? pathSelection === "scratch"
                                                ? "Create a Project"
                                                : "Import BOQ"
                                            : "Continue"}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}
