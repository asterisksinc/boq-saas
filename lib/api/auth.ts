export type ApiEnvelope<T> = {
    data?: T;
    error?: {
        code?: string;
        message?: string;
        fields?: Record<string, string[]>;
        requestId?: string;
    };
    requestId?: string;
};

export type AuthUser = {
    id: string;
    email?: string | null;
};

export type AuthContext = {
    workspace?: { id?: string; name?: string } | null;
    onboarding?: {
        current_step?: string;
        status?: "not_started" | "in_progress" | "completed";
    } | null;
    [key: string]: unknown;
};

export type LoginResult = {
    user?: AuthUser;
    context?: AuthContext;
    otpRequired: boolean;
    otpSent?: boolean;
    message?: string;
};

export type DashboardNotification = {
    id: string;
    type: string;
    title: string;
    priority: string | null;
    createdAt: string;
    readAt: string | null;
};

export type DashboardOverview = {
    scope: { workspaceId: string; currency: string; timezone: string; generatedAt: string };
    kpis: {
        totalProjects: number;
        activeProjects: number;
        draftBoqs: number;
        pendingApprovals: number;
        totalEstimatedValue: number | null;
        actualCost: number | null;
        grossMargin: number | null;
    };
    organization: { id: string; name: string; status: string; country: string | null };
    recentProjects: unknown[];
    recentBoqs: unknown[];
    pendingActions: unknown[];
    upcomingDeliverables: unknown[];
    notifications: { unreadCount: number; items: DashboardNotification[] };
    permissions: { canViewFinancials?: boolean; [key: string]: boolean | undefined };
    unavailableSections: Array<{ section: string; reason: "DOMAIN_DEFERRED" }>;
};

export function parseApiResponse<T>(payload: unknown): T & { requestId?: string } {
    const response = payload as ApiEnvelope<T>;
    if (response && typeof response === "object" && "data" in response) {
        return { ...(response.data ?? {} as T), requestId: response.requestId ?? response.error?.requestId } as T & { requestId?: string };
    }
    return payload as T & { requestId?: string };
}

export function getApiErrorMessage(payload: unknown): string {
    if (payload instanceof Error && payload.message) {
        return payload.message;
    }

    if (payload && typeof payload === "object") {
        const response = payload as ApiEnvelope<unknown> & { message?: string };
        if (response.error?.message) return response.error.message;
        if (response.message) return response.message;
    }
    return "Something went wrong. Please try again.";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export async function login(input: { email: string; password: string }) {
    const payload = await request<LoginResult>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
    });

    return payload;
}

export async function register(input: { email: string; password: string; displayName?: string; companyName?: string }) {
    const payload = await request<{ user: AuthUser; emailVerificationRequired: boolean }>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
    });

    return payload;
}

export async function logout() {
    return request<{ loggedOut: boolean }>("/api/v1/auth/logout", { method: "POST" });
}

export async function getCurrentUser() {
    return request<{ user: AuthUser; context?: AuthContext }>("/api/v1/auth/me");
}

export async function getDashboardOverview() {
    return request<DashboardOverview>("/api/v1/dashboard/overview");
}

export async function createProject(input: { name: string; clientName: string; projectType: string; status: "active" | "on_hold" | "planning"; location?: string }) {
    return request<{ id: string }>("/api/v1/projects", { method: "POST", body: JSON.stringify(input) });
}

export async function createBoqImport(input: { fileName: string; fileType: "csv" | "xlsx" | "xls"; rowCount: number; columns: string[]; rows: Array<Array<string | number | boolean | null>> }) {
    return request<{ id: string }>("/api/v1/boq-imports", { method: "POST", body: JSON.stringify(input) });
}

export async function forgotPassword(input: { email: string }) {
    return request<{ message: string }>("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function resetPassword(input: { code: string; password: string }) {
    return request<{ passwordReset: boolean }>("/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function verifyEmail(input: { tokenHash: string; type: "email" | "signup" | "email_change" }) {
    return request<{ verified: boolean }>("/api/v1/auth/verify-email", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function verifyEmailCode(code: string, email?: string) {
    if (email) {
        return request<{ verified: boolean }>("/api/v1/auth/verify-email", {
            method: "POST",
            body: JSON.stringify({ email, otp: code }),
        });
    }

    const url = new URL("/api/v1/auth/verify-email", window.location.origin);
    url.searchParams.set("code", code);

    const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(getApiErrorMessage(payload));
    }

    return parseApiResponse<{ verified: boolean }>(payload);
}

export async function resendVerification(input: { email: string }) {
    return request<{ message: string }>("/api/v1/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export type OnboardingState = {
    currentStep?: string;
    completedSteps?: string[];
    skippedSteps?: string[];
    company?: {
        name?: string | null;
        currency?: string | null;
        timezone?: string | null;
    };
};

export async function getOnboardingState() {
    return request<OnboardingState>("/api/v1/onboarding/me");
}

export async function saveOnboardingState(input: Partial<OnboardingState>) {
    return request<OnboardingState>("/api/v1/onboarding/me", {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export type ActivityStage = {
    id: string;
    name: string;
    color: string | null;
    sortOrder: number;
    terminalType: "completed" | "lost" | null;
    createdAt: string;
    updatedAt: string;
};

export type ActivityTask = {
    id: string;
    projectId: string;
    stageId: string;
    name: string;
    description: string | null;
    assignedTo: string | null;
    ownerId: string | null;
    dueDate: string | null;
    priority: "low" | "medium" | "high" | "critical";
    status: "not_started" | "in_progress" | "blocked" | "completed" | "cancelled";
    attachments: Record<string, unknown>[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    project?: { projectCode: string | null; name: string };
    stage?: { name: string; color: string | null };
};

export type ActivityApproval = {
    id: string;
    projectId: string;
    stageId: string;
    name: string;
    description: string | null;
    approverId: string | null;
    approverName: string | null;
    dueDate: string;
    status: "draft" | "sent" | "in_review" | "approved" | "changes_required" | "rejected" | "cancelled";
    requestedAt: string | null;
    decidedAt: string | null;
    attachments: Record<string, unknown>[];
    requestedBy: string;
    createdAt: string;
    updatedAt: string;
    project?: { projectCode: string | null; name: string };
    stage?: { name: string; color: string | null };
};

export type ActivityComment = {
    id: string;
    entityType: "task" | "approval";
    entityId: string;
    body: string;
    attachments: Record<string, unknown>[];
    authorId: string;
    createdAt: string;
};

export type ActivitySummary = {
    stages: number;
    tasks: {
        total: number;
        overdue: number;
        inProgress: number;
        completed: number;
    };
    approvals: {
        total: number;
        overdue: number;
        inReview: number;
        approved: number;
    };
};

export type PaginatedResponse<T> = {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
};

export async function getActivitySummary() {
    return request<ActivitySummary>("/api/v1/activities/summary");
}

export async function listActivityStages() {
    return request<PaginatedResponse<ActivityStage>>("/api/v1/activities/stages");
}

export async function createActivityStage(input: { name: string; color?: string | null; terminalType?: "completed" | "lost" | null }) {
    return request<ActivityStage>("/api/v1/activities/stages", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function updateActivityStage(stageId: string, input: { name?: string; color?: string | null; terminalType?: "completed" | "lost" | null }) {
    return request<ActivityStage>(`/api/v1/activities/stages/${stageId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function deleteActivityStage(stageId: string) {
    return request<{ deleted: boolean }>(`/api/v1/activities/stages/${stageId}`, {
        method: "DELETE",
    });
}

export async function listActivityTasks(params?: { page?: number; pageSize?: number }) {
    const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<PaginatedResponse<ActivityTask>>(`/api/v1/activities/tasks${query}`);
}

export async function createActivityTask(input: {
    name: string;
    projectId: string;
    stageId: string;
    description?: string | null;
    assignedTo?: string | null;
    ownerId?: string | null;
    dueDate?: string | null;
    priority?: "low" | "medium" | "high" | "critical";
    status?: "not_started" | "in_progress" | "blocked" | "completed" | "cancelled";
    attachments?: Record<string, unknown>[];
}) {
    return request<ActivityTask>("/api/v1/activities/tasks", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function getActivityTask(taskId: string) {
    return request<ActivityTask>(`/api/v1/activities/tasks/${taskId}`);
}

export async function updateActivityTask(taskId: string, input: Partial<{
    name: string;
    stageId: string;
    description: string | null;
    assignedTo: string | null;
    ownerId: string | null;
    dueDate: string | null;
    priority: "low" | "medium" | "high" | "critical";
    status: "not_started" | "in_progress" | "blocked" | "completed" | "cancelled";
    attachments: Record<string, unknown>[];
}>) {
    return request<ActivityTask>(`/api/v1/activities/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function listActivityTaskComments(taskId: string) {
    return request<{ items: ActivityComment[] }>(`/api/v1/activities/tasks/${taskId}/comments`);
}

export async function createActivityTaskComment(taskId: string, input: { body: string; attachments?: Record<string, unknown>[] }) {
    return request<ActivityComment>(`/api/v1/activities/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function listActivityApprovals(params?: { page?: number; pageSize?: number }) {
    const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<PaginatedResponse<ActivityApproval>>(`/api/v1/activities/approvals${query}`);
}

export async function createActivityApproval(input: {
    name: string;
    projectId: string;
    stageId: string;
    description?: string | null;
    approverId?: string | null;
    approverName?: string | null;
    dueDate: string;
    status?: "draft" | "sent" | "in_review";
    attachments?: Record<string, unknown>[];
}) {
    return request<ActivityApproval>("/api/v1/activities/approvals", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function getActivityApproval(approvalId: string) {
    return request<ActivityApproval>(`/api/v1/activities/approvals/${approvalId}`);
}

export async function updateActivityApproval(approvalId: string, input: Partial<{
    name: string;
    stageId: string;
    description: string | null;
    approverId: string | null;
    approverName: string | null;
    dueDate: string;
    status: "draft" | "sent" | "in_review" | "cancelled";
    attachments: Record<string, unknown>[];
}>) {
    return request<ActivityApproval>(`/api/v1/activities/approvals/${approvalId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function decideActivityApproval(approvalId: string, input: { decision: "approved" | "changes_required" | "rejected"; comment?: string }) {
    return request<ActivityApproval>(`/api/v1/activities/approvals/${approvalId}/decision`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function listActivityApprovalComments(approvalId: string) {
    return request<{ items: ActivityComment[] }>(`/api/v1/activities/approvals/${approvalId}/comments`);
}

export async function createActivityApprovalComment(approvalId: string, input: { body: string; attachments?: Record<string, unknown>[] }) {
    return request<ActivityComment>(`/api/v1/activities/approvals/${approvalId}/comments`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export type SubscriptionStatus = "trial" | "active" | "past_due" | "suspended" | "cancelled_at_period_end" | "cancelled";

export type SubscriptionPlan = {
    code: string;
    name: string;
    description: string | null;
    monthlyPrice: number;
    currency: string;
    limits: Record<string, number | null>;
    features: string[];
    sortOrder: number;
};

export type PaymentMethod = {
    id: string;
    brand: string;
    last4: string;
    expiryMonth: number | null;
    expiryYear: number | null;
    isDefault: boolean;
};

export type SubscriptionInvoice = {
    id: string;
    invoiceNumber: string;
    amount: number;
    taxAmount: number;
    currency: string;
    status: string;
    issuedAt: string;
    dueAt: string;
    paidAt: string | null;
};

export type BillingOverview = {
    subscription: {
        id: string;
        workspaceId: string;
        planCode: string;
        billingFrequency: string;
        status: SubscriptionStatus;
        periodStart: string;
        periodEnd: string;
        cancelAtPeriodEnd: boolean;
        lastPaymentError: string | null;
        nextRetryAt: string | null;
        billingContact: string | null;
        seatsUsed?: number;
        subscriptionPlans?: SubscriptionPlan;
    } | null;
    paymentMethod: PaymentMethod | null;
    invoices: SubscriptionInvoice[];
    plans: SubscriptionPlan[];
    usage: {
        teamMembers: { used: number; limit: number | null };
        projects: { used: number; limit: number | null };
        boqs: { used: number; limit: number | null };
        templates: { used: number; limit: number | null };
        storageBytes: number | null;
    };
    canManageBilling: boolean;
};

export type PlanPreview = {
    currentPlan: string;
    newPlan: SubscriptionPlan;
    currentPlanDetails?: SubscriptionPlan;
    breakdown: {
        planCharge: number;
        unusedPeriodCredit: number;
        tax: number;
        dueToday: number;
        nextRenewalAmount?: number;
    };
    nextRenewal: string;
    providerMode: string;
};

export type BillingContactInput = { email: string };

export type PaymentMethodInput = {
    brand: string;
    last4: string;
    expiryMonth?: number;
    expiryYear?: number;
};

export type SubscriptionChangeInput = {
    planCode: "starter" | "professional" | "business" | "enterprise";
    billingFrequency: "monthly" | "annual";
};

export async function getBillingOverview() {
    return request<BillingOverview>("/api/v1/billing/overview");
}

export async function getPlanPreview(planCode: string) {
    return request<PlanPreview>(`/api/v1/billing/plans/preview?plan=${planCode}`);
}

export async function updateBillingContact(input: BillingContactInput) {
    return request<{ billingContact: string }>("/api/v1/billing/contact", {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function updatePaymentMethod(input: PaymentMethodInput) {
    return request<PaymentMethod>("/api/v1/billing/payment-methods", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function changeSubscription(input: SubscriptionChangeInput) {
    return request<{ subscription: BillingOverview["subscription"]; plan: SubscriptionPlan; providerMode: string }>("/api/v1/billing/subscription/change", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function cancelSubscription() {
    return request<BillingOverview["subscription"]>("/api/v1/billing/subscription/cancel", {
        method: "POST",
    });
}

export async function reactivateSubscription() {
    return request<BillingOverview["subscription"]>("/api/v1/billing/subscription/reactivate", {
        method: "POST",
    });
}

export async function retryPayment() {
    return request<BillingOverview["subscription"]>("/api/v1/billing/subscription/retry-payment", {
        method: "POST",
    });
}

export type SettingsOverview = {
    profile: { displayName: string | null; avatarUrl: string | null } | null;
    role: string;
    completionPercent: number;
    usage: { projects: number; boqs: number; templates: number; storageBytes: number | null; aiCredits: number | null };
    settings: Record<string, unknown> | null;
    recentChanges: Array<{ id: string; action: string; createdAt: string; actorUserId: string }>;
};

export type SettingsSection = {
    section: string;
    data: Record<string, unknown>;
};

export type SettingsSectionInput = { data: Record<string, unknown> };

export type HelpArticleContent = string | {
    shortAnswer?: string;
    sections?: Array<{
        heading: string;
        body?: string;
        items?: string[];
    }>;
    [key: string]: unknown;
};

export type HelpArticle = {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    content?: HelpArticleContent;
    readMinutes?: number;
    read_minutes?: number;
    helpfulYes?: number;
    helpful_yes?: number;
    helpfulNo?: number;
    helpful_no?: number;
    popular?: boolean;
    updatedAt?: string;
    updated_at?: string;
    category?: { slug: string; name: string } | null;
    help_categories?: { slug: string; name: string } | Array<{ slug: string; name: string }> | null;
    categoryId?: string;
    category_id?: string;
};

export type HelpCategory = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    sortOrder?: number;
    sort_order?: number;
    active?: boolean;
};

export type HelpOverview = {
    articles: HelpArticle[];
    categories: HelpCategory[];
};

export type ArticleFeedbackInput = { helpful: boolean };

export type SupportTicket = {
    id: string;
    ticketNumber?: string;
    ticket_number?: string;
    issueType?: string;
    issue_type?: string;
    subject: string;
    description: string;
    priority: "low" | "normal" | "high" | "urgent";
    status: "draft" | "open" | "in_progress" | "waiting_on_user" | "resolved" | "closed";
    createdBy?: string;
    created_by?: string;
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
    workspaceId?: string;
    workspace_id?: string;
};

export type SupportTicketMessage = {
    id: string;
    body: string;
    attachments?: Record<string, unknown>[];
    authorId?: string;
    author_id?: string;
    createdAt?: string;
    created_at?: string;
    ticketId?: string;
    ticket_id?: string;
};

export type SupportTicketInput = {
    issueType: string;
    subject: string;
    description: string;
    priority?: "low" | "normal" | "high" | "urgent";
    status?: "draft" | "open";
    projectId?: string | null;
    projectName?: string | null;
    relatedRecord?: string | null;
    browserDevice?: string | null;
    businessImpact?: string | null;
    attemptedAction?: string | null;
    attachments?: Array<Record<string, unknown>>;
};

export type SupportTicketPatchInput = {
    status?: "draft" | "open" | "in_progress" | "waiting_on_user" | "resolved" | "closed";
    issueType?: string;
    subject?: string;
    description?: string;
    priority?: "low" | "normal" | "high" | "urgent";
    projectId?: string | null;
    projectName?: string | null;
    relatedRecord?: string | null;
    browserDevice?: string | null;
    businessImpact?: string | null;
    attemptedAction?: string | null;
    attachments?: Array<Record<string, unknown>>;
};

export type SupportTicketMessageInput = { body: string; attachments?: Record<string, unknown>[] };

export type TicketMetadata = {
    currentStep?: number;
    attemptedAction?: string;
    projectId?: string;
    projectName?: string;
    relatedRecord?: string;
    browserDevice?: string;
    businessImpact?: string;
    attachments?: Array<{ id?: string; name: string; size: number; type: string; url?: string }>;
};

export function parseTicketMetadata(description: string): { cleanDescription: string; metadata: TicketMetadata } {
    if (!description) return { cleanDescription: "", metadata: {} };
    const metaRegex = /<!-- TICKET_METADATA:\s*([\s\S]*?)\s*-->/;
    const match = description.match(metaRegex);
    if (!match) {
        return { cleanDescription: description, metadata: {} };
    }
    try {
        const metadata = JSON.parse(match[1]) as TicketMetadata;
        // Clean out the human-readable context block if present, or just remove metadata tag
        let clean = description.replace(metaRegex, "").trim();
        const contextSplit = clean.split("\n\n---\nContext & Details:");
        if (contextSplit.length > 1) {
            clean = contextSplit[0].trim();
        }
        return { cleanDescription: clean, metadata };
    } catch {
        return { cleanDescription: description, metadata: {} };
    }
}

export function formatTicketDescription(
    mainDescription: string,
    metadata: TicketMetadata
): string {
    const lines: string[] = [mainDescription.trim()];
    const details: string[] = [];

    if (metadata.attemptedAction) {
        details.push(`• What I was trying to do: ${metadata.attemptedAction.trim()}`);
    }
    if (metadata.projectName || metadata.projectId) {
        details.push(`• Project: ${metadata.projectName || metadata.projectId}`);
    }
    if (metadata.relatedRecord) {
        details.push(`• Related Record: ${metadata.relatedRecord.trim()}`);
    }
    if (metadata.browserDevice) {
        details.push(`• Browser / Device: ${metadata.browserDevice.trim()}`);
    }
    if (metadata.businessImpact) {
        details.push(`• Business Impact: ${metadata.businessImpact.trim()}`);
    }
    if (metadata.attachments && metadata.attachments.length > 0) {
        details.push(`• Attachments: ${metadata.attachments.map((a) => a.name).join(", ")}`);
    }

    if (details.length > 0) {
        lines.push("\n\n---\nContext & Details:\n" + details.join("\n"));
    }

    const metaJson = JSON.stringify(metadata);
    lines.push(`\n\n<!-- TICKET_METADATA: ${metaJson} -->`);
    return lines.join("");
}

export async function getSettingsOverview() {
    return request<SettingsOverview>("/api/v1/settings/overview");
}

export async function getSettingsSection(section: string) {
    return request<SettingsSection>(`/api/v1/settings/${section}`);
}

export async function updateSettingsSection(section: string, input: SettingsSectionInput) {
    return request<SettingsSection>(`/api/v1/settings/${section}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function getHelpOverview(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return request<HelpOverview>(`/api/v1/help${query}`);
}

export async function getHelpArticle(slug: string) {
    return request<HelpArticle>(`/api/v1/help/articles/${slug}`);
}

export async function submitArticleFeedback(slug: string, input: ArticleFeedbackInput) {
    return request<{ recorded: boolean }>(`/api/v1/help/articles/${slug}`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function listSupportTickets() {
    return request<{ items: SupportTicket[] }>("/api/v1/support/tickets");
}

export async function getSupportTicket(ticketId: string) {
    return request<SupportTicket>(`/api/v1/support/tickets/${ticketId}`);
}

export async function createSupportTicket(input: SupportTicketInput) {
    return request<SupportTicket>("/api/v1/support/tickets", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function updateSupportTicket(ticketId: string, input: SupportTicketPatchInput) {
    return request<SupportTicket>(`/api/v1/support/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function listSupportTicketMessages(ticketId: string) {
    return request<{ items: SupportTicketMessage[] }>(`/api/v1/support/tickets/${ticketId}/messages`);
}

export async function createSupportTicketMessage(ticketId: string, input: SupportTicketMessageInput) {
    return request<SupportTicketMessage>(`/api/v1/support/tickets/${ticketId}/messages`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}
