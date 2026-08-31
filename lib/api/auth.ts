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

export function parseApiResponse<T>(payload: unknown): T & { requestId?: string } {
    const response = payload as ApiEnvelope<T>;
    if (response && typeof response === "object" && "data" in response) {
        return { ...(response.data ?? {} as T), requestId: response.requestId ?? response.error?.requestId } as T & { requestId?: string };
    }
    return payload as T & { requestId?: string };
}

export function getApiErrorMessage(payload: unknown): string {
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
    const payload = await request<{ user: AuthUser; context?: AuthContext }>("/api/v1/auth/login", {
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

export async function verifyEmailCode(code: string) {
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
