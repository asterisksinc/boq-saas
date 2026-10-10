import { getApiErrorMessage, parseApiResponse } from "./auth";

export type ClientInvitationDetails = {
    id: string;
    token: string;
    projectId: string;
    projectName: string;
    projectStatus: string;
    email: string;
    clientName: string;
    companyName: string;
    inviterName: string;
    role: string;
    status: string;
    expiresAt: string;
    hasExistingAccount?: boolean;
};

export type ClientProjectDetails = {
    id: string;
    projectCode: string;
    name: string;
    clientName: string;
    status: string;
    location: string;
    projectType: string;
    companyName: string;
    projectManager: string;
};

export type ClientDocumentItem = {
    id: string;
    title: string;
    reference: string;
    referenceNumber?: string;
    type: "proposal" | "contract" | "document";
    status: "awaiting_signature" | "signed";
    viewUrl: string;
    requiresSignature: boolean;
    signedAt: string | null;
    signerName?: string | null;
    signedBy?: string | null;
    version?: string;
    fileSize?: string;
};

export type ClientOnboardingState = {
    currentStep: "welcome" | "documents" | "dashboard";
    completedSteps: string[];
    status: "in_progress" | "completed";
    signedDocumentsCount: number;
    allDocumentsSigned: boolean;
};

export type ClientDashboardData = {
    project: {
        id: string;
        projectCode: string;
        name: string;
        clientName: string;
        status: string;
        location: string;
        projectType: string;
        startDate: string | null;
        targetCompletionDate: string | null;
        companyName: string;
        projectManager: string;
        projectManagerEmail: string;
    };
    documents: Array<{
        id: string;
        title: string;
        reference: string;
        status: "awaiting_signature" | "signed";
        signedAt: string | null;
        viewUrl: string;
    }>;
    boqs: Array<{
        id: string;
        boq_number?: string;
        boqNumber?: string;
        version?: string;
        status?: string;
        grand_total?: number;
        grandTotal?: number;
        updated_at?: string;
    }>;
    invoices: Array<{
        id: string;
        invoice_number?: string;
        invoiceNumber?: string;
        status?: string;
        total?: number;
        due_date?: string;
        dueDate?: string;
        updated_at?: string;
    }>;
};

async function clientApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(path, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
        ...options,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(getApiErrorMessage(payload));
    }

    return parseApiResponse<T>(payload);
}

export async function inspectClientInvitation(token: string): Promise<{
    invitation: ClientInvitationDetails;
    alreadyAccepted?: boolean;
}> {
    return clientApiFetch<{ invitation: ClientInvitationDetails; alreadyAccepted?: boolean }>(
        `/api/v1/invitations/${encodeURIComponent(token)}`
    );
}

export async function acceptClientInvitation(token: string): Promise<{
    accepted: boolean;
    projectId: string;
    projectName: string;
}> {
    return clientApiFetch<{ accepted: boolean; projectId: string; projectName: string }>(
        `/api/v1/invitations/${encodeURIComponent(token)}`,
        { method: "POST" }
    );
}

export async function registerClientAccount(
    token: string,
    data: { fullName: string; email: string; password: string; confirmPassword: string }
): Promise<{
    success: boolean;
    userId: string;
    projectId: string;
    projectName: string;
}> {
    return clientApiFetch<{
        success: boolean;
        userId: string;
        projectId: string;
        projectName: string;
    }>(`/api/v1/invitations/${encodeURIComponent(token)}/register`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export const inspectClientInvite = async (token: string): Promise<ClientInvitationDetails> => {
    const res = await inspectClientInvitation(token);
    return res.invitation;
};

export const acceptClientInvite = acceptClientInvitation;

export async function registerClientInvite(
    token: string,
    data: { fullName: string; email?: string; password: string; confirmPassword: string }
) {
    let email = data.email;
    if (!email) {
        const inspected = await inspectClientInvitation(token);
        email = inspected.invitation.email;
    }
    return registerClientAccount(token, {
        fullName: data.fullName,
        email: email,
        password: data.password,
        confirmPassword: data.confirmPassword,
    });
}

export async function getClientProject(projectId: string): Promise<{ project: ClientProjectDetails }> {
    return clientApiFetch<{ project: ClientProjectDetails }>(
        `/api/v1/client/projects/${encodeURIComponent(projectId)}`
    );
}

export async function getClientDocuments(projectId: string): Promise<{ items: ClientDocumentItem[] }> {
    return clientApiFetch<{ items: ClientDocumentItem[] }>(
        `/api/v1/client/projects/${encodeURIComponent(projectId)}/documents`
    );
}

export async function signClientDocument(
    projectId: string,
    documentId: string,
    input: {
        signerName: string;
        consent: boolean;
        signatureType?: "draw" | "type";
        signatureData?: string;
        signatureText?: string;
    }
): Promise<{
    signed: boolean;
    documentId: string;
    documentTitle: string;
    documentReference: string;
    status: string;
    signedAt: string;
    signerName: string;
}> {
    return clientApiFetch<{
        signed: boolean;
        documentId: string;
        documentTitle: string;
        documentReference: string;
        status: string;
        signedAt: string;
        signerName: string;
    }>(`/api/v1/client/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}/sign`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function getClientOnboarding(projectId: string): Promise<{ onboarding: ClientOnboardingState }> {
    return clientApiFetch<{ onboarding: ClientOnboardingState }>(
        `/api/v1/client/projects/${encodeURIComponent(projectId)}/onboarding`
    );
}

export async function updateClientOnboarding(
    projectId: string,
    step: "welcome" | "documents" | "dashboard"
): Promise<{
    currentStep: string;
    completedSteps: string[];
    status: string;
}> {
    return clientApiFetch<{
        currentStep: string;
        completedSteps: string[];
        status: string;
    }>(`/api/v1/client/projects/${encodeURIComponent(projectId)}/onboarding`, {
        method: "PATCH",
        body: JSON.stringify({ step }),
    });
}

export async function getClientDashboard(projectId?: string): Promise<ClientDashboardData> {
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    return clientApiFetch<ClientDashboardData>(`/api/v1/client/dashboard${q}`);
}

export type ClientBoqListItem = {
    id: string;
    projectId: string;
    projectName: string;
    boqNumber: string;
    version: string;
    status: string;
    roomsCount: number;
    itemsCount: number;
    estimatedValue: number;
    grandTotal: number;
    subtotal: number;
    date: string;
    updatedAt: string;
};

export type ClientBoqRoomItem = {
    id: string;
    name: string;
    description: string | null;
    unit: string;
    quantity: number;
    rate: number;
    amount: number;
};

export type ClientBoqCategory = {
    id: string;
    name: string;
    description: string | null;
    items: ClientBoqRoomItem[];
};

export type ClientBoqRoom = {
    id: string;
    name: string;
    description: string | null;
    categories: ClientBoqCategory[];
};

export type ClientBoqDetail = {
    id: string;
    projectId: string;
    projectName: string;
    projectCode: string;
    clientName: string;
    boqNumber: string;
    version: string;
    status: string;
    subtotal: number;
    markupPercent: number;
    markupAmount: number;
    taxPercent: number;
    taxAmount: number;
    grandTotal: number;
    rooms: ClientBoqRoom[];
    updatedAt: string;
};

export type ClientInvoiceListItem = {
    id: string;
    invoiceNumber: string;
    systemCode?: string;
    manualNumber?: string | null;
    documentType: string;
    clientName: string;
    projectId: string;
    projectName: string;
    issueDate: string;
    dueDate: string;
    milestone: string;
    taxRate: number;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    totalPaid: number;
    outstanding: number;
    currency: string;
    status: string;
    updatedAt: string;
};

export type ClientInvoiceDetail = ClientInvoiceListItem & {
    billingAddress?: Record<string, string>;
    reference?: string | null;
    additionalNotes?: string | null;
    bankDetails?: Record<string, string>;
    items: Array<{
        id?: string;
        position?: number;
        description: string;
        quantity: number;
        rate: number;
        amount?: number;
    }>;
    payments: Array<{
        id: string;
        amount: number;
        paid_at: string;
        method: string | null;
        reference: string | null;
        notes: string | null;
    }>;
};

export type ClientApprovalItem = {
    id: string;
    title: string;
    type: string;
    description: string;
    projectId: string;
    projectName: string;
    projectCode: string;
    status: "draft" | "sent" | "in_review" | "pending" | "approved" | "rejected" | "changes_required" | "cancelled";
    dueDate: string | null;
    requestedAt: string;
    decidedAt: string | null;
    attachments: Array<{ name: string; url: string; type?: string }>;
    comments: Array<{
        id: string;
        body: string;
        author_id?: string;
        created_at?: string;
        createdAt?: string;
    }>;
    proposalId?: string;
};

export async function listClientProjects(): Promise<{ items: ClientProjectDetails[] }> {
    return clientApiFetch<{ items: ClientProjectDetails[] }>("/api/v1/client/projects");
}

export async function listClientBoqs(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    projectId?: string;
}): Promise<{
    items: ClientBoqListItem[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
    pendingApprovals: number;
}> {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    if (params?.status) sp.set("status", params.status);
    if (params?.search) sp.set("search", params.search);
    if (params?.projectId) sp.set("projectId", params.projectId);
    const q = sp.toString();
    return clientApiFetch(`/api/v1/client/boqs${q ? `?${q}` : ""}`);
}

export async function getClientBoq(boqId: string): Promise<ClientBoqDetail> {
    return clientApiFetch<ClientBoqDetail>(`/api/v1/client/boqs/${encodeURIComponent(boqId)}`);
}

export async function listClientDocuments(params?: {
    projectId?: string;
    search?: string;
    status?: string;
    type?: string;
}): Promise<{ items: ClientDocumentItem[] }> {
    const sp = new URLSearchParams();
    if (params?.projectId) sp.set("projectId", params.projectId);
    if (params?.search) sp.set("search", params.search);
    if (params?.status) sp.set("status", params.status);
    if (params?.type) sp.set("type", params.type);
    const q = sp.toString();
    return clientApiFetch<{ items: ClientDocumentItem[] }>(`/api/v1/client/documents${q ? `?${q}` : ""}`);
}

export async function listClientInvoices(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    projectId?: string;
}): Promise<{
    items: ClientInvoiceListItem[];
    summary: {
        totalInvoiced: number;
        collected: number;
        outstanding: number;
        totalCount: number;
    };
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
}> {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    if (params?.status) sp.set("status", params.status);
    if (params?.search) sp.set("search", params.search);
    if (params?.projectId) sp.set("projectId", params.projectId);
    const q = sp.toString();
    return clientApiFetch(`/api/v1/client/invoices${q ? `?${q}` : ""}`);
}

export async function getClientInvoice(invoiceId: string): Promise<ClientInvoiceDetail> {
    return clientApiFetch<ClientInvoiceDetail>(`/api/v1/client/invoices/${encodeURIComponent(invoiceId)}`);
}

export async function listClientApprovals(params?: {
    projectId?: string;
}): Promise<{
    items: ClientApprovalItem[];
    pendingCount: number;
    decidedCount: number;
}> {
    const sp = new URLSearchParams();
    if (params?.projectId) sp.set("projectId", params.projectId);
    const q = sp.toString();
    return clientApiFetch(`/api/v1/client/approvals${q ? `?${q}` : ""}`);
}

export async function submitClientApprovalDecision(
    approvalId: string,
    decision: "approved" | "rejected" | "changes_required",
    comment?: string
): Promise<{ id: string; status: string; decidedAt?: string }> {
    return clientApiFetch(`/api/v1/client/approvals/${encodeURIComponent(approvalId)}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, comment }),
    });
}

export async function addClientApprovalComment(
    approvalId: string,
    body: string
): Promise<{ id: string; body: string; author_id?: string; created_at?: string; createdAt?: string }> {
    return clientApiFetch(`/api/v1/client/approvals/${encodeURIComponent(approvalId)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
    });
}

