# BOQ Design Arena frontend integration guide

This guide describes how the existing Next.js App Router frontend should integrate with the Phase 1 backend. It does not require the frontend to call Supabase directly.

## 1. Integration architecture

```text
Browser UI
   │  fetch('/api/v1/...', { credentials: 'include' })
   ▼
Next.js Route Handler
   │  @supabase/ssr cookie session
   ▼
Supabase Auth + Postgres RPC/RLS
```

Use the Next.js API as the only application-facing backend:

- The browser never stores access or refresh tokens.
- Supabase session cookies are created, refreshed, and removed by the API.
- Workspace ID, user ID, role, and permissions come from the authenticated session and database membership—not form fields, URL parameters, or local storage.
- Keep frontend and API on the same origin. The backend intentionally does not enable cross-origin credential sharing. A separately hosted frontend requires an explicit CORS/cookie security change.

## 2. Required backend setup before UI integration

Create `.env.local` from `.env.example`, then configure:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
APP_URL=http://localhost:3000
PASSWORD_RESET_REDIRECT_URL=http://localhost:3000/reset-password
EMAIL_VERIFICATION_REDIRECT_URL=http://localhost:3000/onboarding
```

Then:

1. Apply `supabase/migrations/20260827173000_phase1_auth_user_dashboard.sql` to the target Supabase project.
2. In Supabase Auth URL Configuration, set the local Site URL to `http://localhost:3000`.
3. Add `http://localhost:3000/onboarding` and `http://localhost:3000/reset-password` to the redirect allowlist.
4. Configure the equivalent HTTPS production URLs before deployment.
5. Start the application with `npm run dev` and validate the flow with the supplied Postman collection.

The publishable key is designed for browser/server-client initialization and is protected by RLS. Never expose the Supabase service-role key.

## 3. Recommended frontend file placement

Create these files only when frontend implementation is authorized:

```text
lib/
  api/
    client.ts                 # fetch wrapper, envelope/error handling, one refresh retry
    contracts.ts              # API request/response TypeScript types
features/
  auth/
    api.ts                    # register/login/logout/me/recovery functions
    AuthProvider.tsx          # current user state and permission helpers
  user/api.ts                 # profile, password, and preferences
  onboarding/api.ts           # resumable onboarding state
  dashboard/api.ts            # overview and paginated widgets
app/
  (auth)/login/page.tsx
  (auth)/register/page.tsx
  (auth)/forgot-password/page.tsx
  (auth)/reset-password/page.tsx
  onboarding/page.tsx
  dashboard/page.tsx
```

Do not put API calls directly inside presentation components. Pages/providers should call a feature API module and pass data into UI components.

## 4. Shared API client

Recommended `lib/api/client.ts`:

```ts
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    requestId: string;
  };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type ApiEnvelope<T> = { data: T; requestId?: string };

async function send<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const json = await response.json().catch(() => null) as ApiEnvelope<T> | ApiErrorBody | null;

  if (!response.ok) {
    const error = json && "error" in json ? json.error : undefined;
    throw new ApiError(
      response.status,
      error?.code ?? "UNKNOWN_ERROR",
      error?.message ?? "The request could not be completed.",
      error?.requestId ?? response.headers.get("x-request-id") ?? undefined,
      error?.fields,
    );
  }

  return (json as ApiEnvelope<T>).data;
}

export const api = {
  get: <T>(path: string) => send<T>(path),
  post: <T>(path: string, value?: unknown) =>
    send<T>(path, { method: "POST", body: value === undefined ? undefined : JSON.stringify(value) }),
  patch: <T>(path: string, value: unknown) =>
    send<T>(path, { method: "PATCH", body: JSON.stringify(value) }),
};
```

Always use `credentials: "include"`. Do not read Supabase cookies in client JavaScript and do not mirror the session in local storage.

## 5. Core response contracts

Recommended `lib/api/contracts.ts`:

```ts
export interface PermissionFlags {
  canCreateProject: boolean;
  canCreateBoq: boolean;
  canViewFinancials: boolean;
  canApprove: boolean;
  canExport: boolean;
}

export interface CurrentContext {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    status: "active" | "suspended";
  };
  profile: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  preferences: {
    user_id: string;
    timezone: string;
    locale: string;
    updated_at: string;
  } | null;
  workspace: {
    id: string;
    name: string;
    status: string;
    currency: string;
    timezone: string;
    country: string | null;
    profile: Record<string, unknown> | null;
  };
  membership: { role: "owner" | "admin" | "member" | "viewer"; status: string };
  permissions: PermissionFlags;
  onboarding: {
    workspace_id: string;
    user_id: string;
    current_step: string;
    completed_steps: string[];
    skipped_steps: string[];
    status: "not_started" | "in_progress" | "completed";
    updated_at: string;
  } | null;
}

export interface DashboardOverview {
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
  costOverview: { currency: string; series: unknown[] } | null;
  boqActivity: unknown[];
  recentProjects: unknown[];
  recentBoqs: unknown[];
  pendingActions: unknown[];
  upcomingDeliverables: unknown[];
  notifications: { unreadCount: number; items: unknown[] };
  permissions: PermissionFlags;
  unavailableSections: Array<{ section: string; reason: "DOMAIN_DEFERRED" }>;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
```

Current-context database records use snake_case because they are returned from Postgres rows. Dashboard aggregate keys and all request DTOs use camelCase. Keep the distinction in the API layer rather than scattering conversions across components.

## 6. Endpoint-to-screen mapping

| Frontend screen/action | Method and endpoint | Integration behavior |
|---|---|---|
| Registration form | `POST /auth/register` | Send email/password and optional display/company names. If `otpSent` is true, show the same 6-digit OTP entry used by Login. |
| Login form | `POST /auth/login` | Send `{ email }` to request an OTP, then `{ email, otp }` to verify it. On success, cache the returned context in memory. |
| App bootstrap | `GET /auth/me` | Load once in `AuthProvider`; a 401 means signed out. |
| Logout button | `POST /auth/logout` | Clear in-memory user state and route to Login. |
| Forgot-password form | `POST /auth/forgot-password` | Always show the same confirmation message. |
| Reset-password page | `POST /auth/reset-password` | Read `code` from URL and submit it with the new password. |
| Verification redirect | `GET /auth/verify-email?code=...` | Exchange the one-time code, then remove it from the browser URL. |
| Resend verification | `POST /auth/resend-verification` | Show generic confirmation; disable/retry UI to respect rate limits. |
| Profile page | `GET/PATCH /users/me` | Only `displayName` is currently writable. |
| Change-password form | `PATCH /users/me/password` | Send current and new passwords; display 401 as incorrect current password. |
| Preferences | `GET/PATCH /users/me/preferences` | Timezone and locale only. |
| Onboarding | `GET/PATCH /onboarding/me` | Resume saved step and company configuration. Never send workspace ID. |
| Dashboard landing | `GET /dashboard/overview` | Primary initial request; render permissions and empty/deferred states. |
| Widget drill-down | Dashboard list endpoints | Use `page` and `pageSize`; Projects/BOQs/actions/deliverables are intentionally empty until later phases. |

All paths in frontend code are prefixed by `/api/v1` through the shared API client.

## 7. Auth feature API

Recommended `features/auth/api.ts`:

```ts
import { api } from "@/lib/api/client";
import type { CurrentContext } from "@/lib/api/contracts";

export const authApi = {
  register: (input: {
    email: string;
    password: string;
    displayName?: string;
    companyName?: string;
  }) => api.post<{ user: { id?: string; email?: string }; emailVerificationRequired: boolean; otpSent: boolean; message: string }>("/auth/register", input),

  requestLoginOtp: (email: string) =>
    api.post<{ otpSent: true; message: string }>("/auth/login", { email }),

  verifyLoginOtp: (email: string, otp: string) =>
    api.post<{ user: { id: string; email?: string }; context: CurrentContext }>("/auth/login", { email, otp }),

  me: () => api.get<CurrentContext>("/auth/me"),
  refresh: () => api.post<{ expiresAt: number }>("/auth/refresh"),
  logout: () => api.post<{ loggedOut: boolean }>("/auth/logout"),
  forgotPassword: (email: string) => api.post<{ message: string }>("/auth/forgot-password", { email }),
  resetPassword: (code: string, password: string) => api.post<{ passwordReset: boolean }>("/auth/reset-password", { code, password }),
  verifyEmail: (code: string) => api.get<{ verified: boolean }>(`/auth/verify-email?code=${encodeURIComponent(code)}`),
  resendVerification: (email: string) => api.post<{ message: string }>("/auth/resend-verification", { email }),
};
```

## 8. Application bootstrap and route decisions

At startup, call `GET /auth/me` once:

```ts
try {
  const context = await authApi.me();
  setAuth({ status: "authenticated", context });
} catch (error) {
  if (error instanceof ApiError && error.status === 401) {
    setAuth({ status: "anonymous", context: null });
  } else {
    setAuth({ status: "error", context: null });
  }
}
```

Recommended post-login routing:

```ts
const onboarding = result.context.onboarding;

if (!result.context.user.emailVerified) {
  router.replace("/verify-email");
} else if (!onboarding || onboarding.status !== "completed") {
  router.replace("/onboarding");
} else {
  router.replace("/dashboard");
}
```

Do not authorize from these client-side checks. They improve navigation only; RLS and backend permission checks remain authoritative.

## 9. Email-verification page

The configured verification redirect is `/onboarding`. On that page, handle an optional `code` before loading onboarding:

```ts
const code = searchParams.get("code");

if (code) {
  await authApi.verifyEmail(code);
  router.replace("/onboarding"); // removes the one-time code from URL/history
}
```

Show an error state for an expired link and offer **Resend verification**. Never log or persist the code.

## 10. Password-reset page

Supabase redirects the recovery email to `/reset-password?code=...`.

```ts
const code = searchParams.get("code");

async function submit(newPassword: string) {
  if (!code) throw new Error("Missing recovery code");
  await authApi.resetPassword(code, newPassword);
  router.replace("/login?passwordReset=1");
}
```

The backend exchanges the code, changes the password, and revokes other sessions. Remove the code from the URL after success.

## 11. Onboarding integration

Load saved state with `GET /onboarding/me`. Save after each completed step:

```ts
await api.patch("/onboarding/me", {
  currentStep: "company_setup",
  completedSteps: ["account_created", "company_setup"],
  skippedSteps: [],
  company: {
    name: values.companyName,
    logoUrl: values.logoUrl || null,
    website: values.website || null,
    businessEmail: values.businessEmail || null,
    phone: values.phone || null,
    address: values.address || null,
    country: values.country || null,
    currency: values.currency,
    taxId: values.taxId || null,
    timezone: values.timezone,
  },
});
```

Only owner/admin members may update company settings. Optional Project/BOQ onboarding steps should display as deferred or skippable; do not create fake entities.

## 12. Dashboard integration

Load `GET /dashboard/overview` as the initial dashboard request. Render widgets independently:

- If `permissions.canViewFinancials` is false, hide financial cards or show a locked state. Never convert `null` financial values to zero.
- If `unavailableSections` includes a widget's domain, show a planned/deferred empty state—not an error toast.
- Notifications are real data. Other Phase 1 list endpoints deliberately return typed empty pages.
- Use `scope.currency` and `scope.timezone` for display formatting.
- Use permission flags for action visibility; never infer capability solely from membership role.

Example:

```ts
const overview = await api.get<DashboardOverview>("/dashboard/overview");

const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: overview.scope.currency,
});

const estimatedValue = overview.permissions.canViewFinancials && overview.kpis.totalEstimatedValue !== null
  ? money.format(overview.kpis.totalEstimatedValue)
  : null;
```

## 13. Error handling

| Status/code | UI behavior |
|---|---|
| `400 VALIDATION_ERROR` | Map `error.fields` to inputs; show the general message if no field entry exists. |
| `401 UNAUTHENTICATED` | Clear in-memory auth state and redirect to Login. Do not repeatedly call refresh. |
| `403 FORBIDDEN` | Show an access-denied state; do not hide it as “not found” unless the endpoint uses that convention. |
| `409 CONFLICT` | Registration email conflict; show the backend message. |
| `429 RATE_LIMITED` | Disable submission temporarily and show a retry message. |
| `500 INTERNAL_ERROR` | Show a generic retry state and include `requestId` in support/debug UI. |

Never display raw stack traces or Supabase internals. Log the backend `requestId`, not passwords, tokens, or recovery codes.

## 14. Session refresh strategy

Normal API calls and Supabase SSR handle cookie refresh. If an active screen receives a single 401 because the session expired:

1. Call `POST /auth/refresh` once.
2. If refresh succeeds, retry the original GET once.
3. If refresh fails, clear in-memory auth state and route to Login.

Do not retry login, registration, password, or mutation requests automatically. Do not create an infinite refresh loop.

## 15. Production checklist

- Use HTTPS for the frontend/API origin.
- Set `APP_URL`, `PASSWORD_RESET_REDIRECT_URL`, and `EMAIL_VERIFICATION_REDIRECT_URL` to production HTTPS URLs.
- Add only those exact URLs to Supabase Auth's redirect allowlist.
- Keep the API and frontend same-origin unless CORS and cookie policy are intentionally redesigned.
- Apply migrations before deploying the application build.
- Configure Supabase Auth email templates and production rate limits.
- Test two separate users to prove workspace isolation.
- Test owner/admin versus member/viewer financial visibility.
- Verify registration, confirmation, login, refresh, logout, forgot/reset password, profile, onboarding resume, and dashboard empty state.
- Never expose or commit the Supabase service-role key.

## 16. Source files

- API implementation: `app/api/v1/[...path]/route.ts`
- Validation contracts: `lib/api/validation.ts`
- Supabase server client: `lib/supabase/server.ts`
- Database/RLS migration: `supabase/migrations/20260827173000_phase1_auth_user_dashboard.sql`
- OpenAPI: `openapi.yaml`
- Postman assets: `postman/`
