# BOQ Design Arena frontend integration guide

This guide describes how the existing Next.js App Router frontend should integrate with Auth/User/Dashboard, Projects and project Excel import, Proposals, Documents, and Invoices. It does not require the frontend to call Supabase directly.

## Billing, Settings, Activities, and Help integration (backend implemented; frontend unchanged)

All endpoints below require the same-origin authenticated cookie. Workspace members can read these modules. Members can create and update activities and support tickets. Billing mutations and organization-wide settings changes require `owner` or `admin`; use `canManageBilling` from the billing response to hide those controls.

### Billing and plan management

| UI action | API |
|---|---|
| Billing screen, status banners, usage, invoices | `GET /billing/overview` |
| Upgrade/downgrade confirmation breakdown | `GET /billing/plans/preview?plan=business` |
| Billing contact | `PATCH /billing/contact` |
| Replace default payment method | `POST /billing/payment-methods` |
| Confirm plan change | `POST /billing/subscription/change` |
| Cancel at period end | `POST /billing/subscription/cancel` |
| Reactivate | `POST /billing/subscription/reactivate` |
| Retry failed payment | `POST /billing/subscription/retry-payment` |

The current implementation reports `providerMode: "internal"`: it persists and demonstrates subscription lifecycle state but does not charge a card. Connect a payment-provider webhook before treating these state changes as financial settlement. Never collect or send a full card number/CVV; the API accepts only tokenized-display metadata (`brand`, `last4`, expiry) for the current provider-free backend.

```ts
const billing = await api.get<BillingOverview>("/billing/overview");
const preview = await api.get<PlanPreview>("/billing/plans/preview?plan=business");
await api.post("/billing/subscription/change", { planCode: "business", billingFrequency: "monthly" });
```

Render subscription banners directly from `subscription.status`: `trial`, `active`, `past_due`, `suspended`, `cancelled_at_period_end`, or `cancelled`. Usage values can be `null` when the metric is unavailable or unlimited.

### Settings

Use `GET /settings/overview` for profile completion, usage cards, configuration health inputs, and recent audit changes. Organization setting sections use `GET`/`PATCH /settings/{section}` where section is `branding`, `boq-costing`, `integrations`, `notifications`, `security`, or `advanced`.

```ts
await api.patch("/settings/notifications", {
  data: { email: true, tasks: true, approvals: true, billing: true, weeklyDigest: true },
});
```

The browser sends the complete section in `{ data: Record<string, unknown> }`. Personal profile, password, and locale/timezone continue to use `/users/me`, `/users/me/password`, and `/users/me/preferences`.

### Activities

| UI area | API |
|---|---|
| KPI cards | `GET /activities/summary` |
| Stage board | `GET /activities/stages` |
| Create stage | `POST /activities/stages` |
| Edit/delete stage | `PATCH` / `DELETE /activities/stages/{stageId}` |
| Task list/create | `GET` / `POST /activities/tasks` |
| Task drawer/edit | `GET` / `PATCH /activities/tasks/{taskId}` |
| Task comments/activity | `GET` / `POST /activities/tasks/{taskId}/comments` |
| Approval list/create | `GET` / `POST /activities/approvals` |
| Approval drawer/edit | `GET` / `PATCH /activities/approvals/{approvalId}` |
| Approve/request changes/reject | `POST /activities/approvals/{approvalId}/decision` |
| Approval feedback | `GET` / `POST /activities/approvals/{approvalId}/comments` |

Activity creation rejects cross-workspace `projectId` and `stageId` values. Attachment arrays are document references/metadata; upload binary files through the existing authenticated Documents API first.

### Help centre and support tickets

| UI action | API |
|---|---|
| Popular articles/categories | `GET /help` |
| Search | `GET /help?search=excel` |
| Article detail | `GET /help/articles/{slug}` |
| Helpful yes/no | `POST /help/articles/{slug}` with `{ helpful: boolean }` |
| My workspace tickets | `GET /support/tickets` |
| Raise/save ticket | `POST /support/tickets` |
| Ticket detail/status | `GET` / `PATCH /support/tickets/{ticketId}` |
| Conversation | `GET` / `POST /support/tickets/{ticketId}/messages` |

Postman folders `16 — Billing & Settings (User)`, `17 — Activities (User)`, and `18 — Help & Support (User)` contain ready-to-run examples. Billing/settings writes intentionally return `403` for the seeded `demo@boq.com` member account; its read endpoints, activities, and support flows are fully usable.

## Project Templates integration (backend implemented; frontend unchanged)

The template screens shown in the supplied designs map to authenticated, workspace-scoped APIs. There is no separate public/admin template API. Active workspace users can read templates; `owner`, `admin`, and `member` can create/edit/publish/duplicate/use them; `viewer` is read-only; only `owner`/`admin` can archive.

| UI area/action | API |
|---|---|
| Template landing KPIs and recently used | `GET /project-templates/overview` |
| Grid/list, search, filters, pagination | `GET /project-templates?page=1&pageSize=20&search=&status=&type=` |
| New Project Template | `POST /project-templates` |
| Template header, Overview, composition | `GET /project-templates/{templateId}` |
| Edit template metadata | `PATCH /project-templates/{templateId}` |
| Structure | `GET` / `PATCH /project-templates/{templateId}/structure` |
| Costing & BOQ | `GET` / `PATCH /project-templates/{templateId}/costing-boq` |
| Workflow (stages/tasks/milestones/approvals/rules) | `GET` / `PATCH /project-templates/{templateId}/workflow` |
| Document requirements | `GET` / `PATCH /project-templates/{templateId}/documents` |
| Publish and create immutable version | `POST /project-templates/{templateId}/publish` |
| Versions tab | `GET /project-templates/{templateId}/versions?page=1&pageSize=20` |
| Use Template | `POST /project-templates/{templateId}/use` |
| Usage tab | `GET /project-templates/{templateId}/usage?page=1&pageSize=20` |
| Duplicate | `POST /project-templates/{templateId}/duplicate` |
| Archive | `DELETE /project-templates/{templateId}` |

The section endpoints intentionally store each complex designer as one bounded JSON document. This lets the frontend implement drag/drop and nested condition builders without issuing a request per row. Send the complete latest section after an edit, debounce autosave, and use the returned `version` as the displayed published-version baseline. Publishing snapshots all sections into immutable version history.

```ts
export type TemplateSection = Record<string, unknown>;

export interface ProjectTemplate {
  id: string;
  templateCode: string;
  name: string;
  description: string | null;
  businessType: string;
  projectType: string;
  team: string | null;
  region: string | null;
  visibility: "workspace";
  status: "draft" | "active" | "needs_review" | "archived";
  version: number;
  useCount: number;
  composition: {
    rooms: number; boqSections: number; items: number; stages: number;
    tasks: number; milestones: number; approvals: number; rules: number; documents: number;
  };
  structure?: TemplateSection;
  costingBoq?: TemplateSection;
  workflow?: TemplateSection;
  documents?: TemplateSection[];
}
```

Create a draft with all designer state when available:

```ts
const template = await api.post<ProjectTemplate>("/project-templates", {
  name: "Premium 3BHK Residential",
  description: "Reusable residential project delivery template",
  businessType: "Residential",
  projectType: "3BHK",
  team: "Residential Design",
  region: "India",
  visibility: "workspace",
  tags: ["Premium", "3BHK"],
  structure: { areas: [] },
  costingBoq: { sections: [], itemCount: 0 },
  workflow: { stages: [], tasks: [], milestones: [], approvals: [], rules: [] },
  documents: [],
});
```

Replace one complex section after editing:

```ts
await api.patch(`/project-templates/${template.id}/workflow`, {
  data: { stages, tasks, milestones, approvals, rules },
});
```

`Use Template` is enabled only for an active (published) template. It atomically creates a planning project, stores the exact immutable template snapshot on the usage record, increments usage, and returns `{ projectId, templateId, templateVersion, snapshot }`:

```ts
const created = await api.post<{
  projectId: string;
  templateId: string;
  templateVersion: number;
  snapshot: ProjectTemplate;
}>(
  `/project-templates/${template.id}/use`,
  {
    projectName: "Sharma Residence",
    clientName: "Sharma Group",
    location: "Hyderabad",
    startDate: "2026-09-15",
    targetCompletionDate: "2026-12-15",
  },
);
router.push(`/projects/${created.projectId}`);
```

Do not send `workspaceId`, template/project codes, creator/updater IDs, use counts, version numbers, timestamps, or project template provenance. Those are server-owned. The supplied Postman folder `15 — Project Templates (User)` follows the intended create → section editing → publish → use flow.

## Projects screen integration (backend implemented; frontend unchanged)

The Projects list, editor, lifecycle actions, duplication, room setup, and spreadsheet import are tenant-scoped to the authenticated user's active workspace. Never send `workspaceId`, `createdBy`, `projectCode`, `progress`, or financial totals from the browser; the server owns those fields.

| UI action | API |
|---|---|
| List/search/filter projects | `GET /projects?page=1&pageSize=20&search=&status=&type=&assignedToMe=false` |
| Create from scratch/template-derived form | `POST /projects` |
| Open Project / Project Details | `GET /projects/{projectId}` |
| Edit Project | `PATCH /projects/{projectId}` |
| Put on hold / mark completed | `POST /projects/{projectId}/status` |
| Duplicate Project | `POST /projects/{projectId}/duplicate` |
| Delete Project | `DELETE /projects/{projectId}` (owner/admin only; permanent) |
| List/add rooms | `GET` / `POST /projects/{projectId}/rooms` |
| Edit/delete room | `PATCH` / `DELETE /projects/{projectId}/rooms/{roomId}` |
| Download import template | `GET /projects/import-template` |
| Validate Excel before confirmation | `POST /projects/imports/preview` (multipart) |
| Commit Excel import | `POST /projects/imports` (multipart) |
| Show import history | `GET /projects/imports?page=1&pageSize=20` |

Create example:

```ts
const project = await api.post<Project>("/projects", {
  name: "Oberoi Residence — Bandra West",
  clientName: "Nikhil Oberoi",
  clientContact: "+91 98765 43210",
  clientEmail: "nikhil@example.com",
  projectType: "Residential",
  status: "planning",
  location: "Bandra West, Mumbai",
  description: "4-bedroom residential interior",
  areaSqft: 3200,
  projectValue: 4800000,
  approvedBudget: 4250000,
  startDate: "2026-09-15",
  targetCompletionDate: "2026-12-15",
  tags: ["Luxury", "Turnkey"],
});
```

Valid project statuses are `planning`, `active`, `in_progress`, `on_hold`, and `completed`. Completing a project sets progress to 100. The detail response includes `rooms`; it intentionally does not fabricate Costing, BOQ, Payment, Documents, or Activity data.

### Excel/CSV import

The browser must upload the original file. It must not parse the workbook itself. Do not set `Content-Type` manually when sending `FormData`, because the browser must add the multipart boundary.

```ts
async function uploadProjectSheet(file: File, preview = true) {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(
    `/api/v1/projects/imports${preview ? "/preview" : ""}`,
    { method: "POST", credentials: "include", body: form },
  );
  const payload = await response.json();
  if (!response.ok) throw payload.error;
  return payload.data;
}
```

Accepted files are `.csv`, `.xls`, and `.xlsx`, up to 10 MB and 5,000 data rows. The first worksheet is used unless the multipart `sheet` field names another worksheet. Preview returns at most 100 row details, while counts cover the entire worksheet.

Canonical headings are: `ProjectName`, `ClientName`, `ProjectType`, `Status`, `Location`, `ClientContact`, `ClientEmail`, `Description`, `AreaSqft`, `ProjectValue`, `ApprovedBudget`, `StartDate`, `TargetCompletionDate`, and `Tags`. Only the first three are required; status defaults to `planning`. Dates should use `YYYY-MM-DD`, and tags are comma-separated.

Strict commit (`POST /projects/imports`) writes nothing when any row is invalid and returns `422 IMPORT_VALIDATION_FAILED`. After showing the preview and receiving explicit user confirmation, the UI may call `POST /projects/imports?skipInvalid=true` to import valid rows and return invalid rows as `errors`. A successful import response contains `importId`, counts, created projects, and skipped-row errors.

For the BOQs tab, use the same multipart pattern with `POST /boq-imports/preview` and `POST /boq-imports/upload`. Add `projectId` to the form to link the BOQ to the open project. BOQ headers are preserved exactly, duplicate/blank headers are rejected, and the backend stores the parsed matrix. Limits are 10 MB, 100 columns, and 10,000 data rows. The older JSON `POST /boq-imports` contract remains available for compatibility, but new frontend work should upload the original file.

## 1. Integration architecture

```text
Browser UI
   │  fetch('/api/v1/...', { credentials: 'include' })
   ▼
Next.js Route Handler
   ├  Gmail SMTP (custom six-digit OTP delivery)
   ├  HMAC-hashed OTP store (expiry / attempt limits)
   │  @supabase/ssr cookie session after OTP verification
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
SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SUPABASE_SECRET_KEY
AUTH_OTP_SECRET=YOUR_RANDOM_64_CHARACTER_HEX_SECRET
GMAIL_SMTP_USER=your-sender@gmail.com
GMAIL_SMTP_APP_PASSWORD=YOUR_16_CHARACTER_GOOGLE_APP_PASSWORD
APP_URL=http://localhost:3000
PASSWORD_RESET_REDIRECT_URL=http://localhost:3000/reset-password
EMAIL_VERIFICATION_REDIRECT_URL=http://localhost:3000/onboarding
```

Then:

1. Generate `AUTH_OTP_SECRET` once with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Store the output only in the deployment secret manager and local `.env.local`.
2. Create a Google App Password for the Gmail sender account (Google Account → Security → 2-Step Verification → App passwords). Put its 16-character value in `GMAIL_SMTP_APP_PASSWORD`.
3. Copy the server-only Supabase secret key from Supabase Dashboard → Project Settings → API Keys into `SUPABASE_SECRET_KEY`.
4. Apply all migrations in timestamp order, including `20260901120000_proposals_documents.sql` and `20260901150000_invoices.sql`. The former creates private document storage; the latter adds invoice totals, items, payments, and RLS.
5. Configure the Supabase Auth Site URL and redirect allowlist for the local and production application URLs.
6. Restart the application after changing secrets, then validate the request/verify flow with the supplied Postman collection.

The publishable key is safe for browser/server-client initialization and protected by RLS. `SUPABASE_SECRET_KEY`, `AUTH_OTP_SECRET`, and `GMAIL_SMTP_APP_PASSWORD` are server-only. Never put them in frontend code, Postman, logs, or `NEXT_PUBLIC_*` variables.

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
  proposals/api.ts            # proposal list, summary, create/edit, lifecycle
  documents/api.ts            # folders, multipart uploads, file operations
  invoices/api.ts             # invoice list/summary, editor, PDF, payments
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
  delete: <T>(path: string, value?: unknown) =>
    send<T>(path, { method: "DELETE", body: value === undefined ? undefined : JSON.stringify(value) }),
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
  canCreateProposal: boolean;
  canManageDocuments: boolean;
  canArchiveProposal: boolean;
  canDeleteDocuments: boolean;
  canCreateInvoice: boolean;
  canRecordPayment: boolean;
  canDeleteInvoice: boolean;
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
  dataSource: "hardcoded_demo";
  demoData: true;
  period: "week" | "month" | "quarter";
  scope: { workspaceId: string; currency: string; timezone: string; generatedAt: string };
  kpis: {
    totalProjects: number;
    activeProjects: number;
    draftBoqs: number;
    pendingApprovals: number;
    totalEstimatedValue: number | null;
    actualCost: number | null;
    grossMargin: number | null;
    grossMarginPercent: number | null;
  };
  organization: { id: string; name: string; status: string; country: string | null };
  costOverview: { currency: string; series: unknown[] } | null;
  analytics: { currency: string; series: Array<{ label: string; estimated: number; actual: number }> } | null;
  projectsAndBoqs: {
    projects: { total: number; inProgress: number; planning: number; onHold: number; completed: number };
    totalBoqValue: number | null;
    boqCompletionPercent: number;
  };
  highlightedBoq: unknown;
  boqActivity: unknown[];
  recentProjects: unknown[];
  recentBoqs: unknown[];
  pendingActions: unknown[];
  upcomingDeliverables: unknown[];
  notifications: { unreadCount: number; items: unknown[] };
  permissions: PermissionFlags;
  demoSections: string[];
  unavailableSections: [];
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
| OTP verification form | `POST /auth/login` | Send `{ email, otp }`; success establishes the cookie session and returns workspace context. |
| Resend verification | `POST /auth/resend-verification` | Show generic confirmation; disable/retry UI to respect rate limits. |
| Profile page | `GET/PATCH /users/me` | Only `displayName` is currently writable. |
| Change-password form | `PATCH /users/me/password` | Send current and new passwords; display 401 as incorrect current password. |
| Preferences | `GET/PATCH /users/me/preferences` | Timezone and locale only. |
| Onboarding | `GET/PATCH /onboarding/me` | Resume saved step and company configuration. Never send workspace ID. |
| Dashboard landing | `GET /dashboard/overview?period=month` | Primary request; Project/BOQ widgets are temporary demo values explicitly marked in the response. |
| Widget drill-down | Dashboard list endpoints | Use `page` and `pageSize`; current Project/BOQ/action/deliverable items are marked demo data. |
| Invoices list/empty state | `GET /invoices` + `GET /invoices/summary` | Render the empty illustration when `total=0`; filters do not change summary cards. |
| Create/edit invoice | `POST /invoices`, `PATCH /invoices/{id}` | Submit line-item inputs; display server-calculated subtotal/tax/total. |
| Invoice preview/actions | Detail, PDF, status, and payment endpoints | Never calculate balances or paid state only in the browser. |

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
  verifyEmailOtp: (email: string, otp: string) =>
    api.post<{ verified: boolean }>("/auth/verify-email", { email, otp }),
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

## 9. Gmail OTP entry page

After registration or `requestLoginOtp`, keep the normalized email in component state and show a six-digit input. Do not put the OTP in a URL, local storage, analytics, or logs.

```ts
async function submitOtp(email: string, otp: string) {
  await authApi.verifyEmailOtp(email, otp);
  router.replace("/login");
}
```

The `GET /auth/verify-email?code=...` form is reserved for Supabase PKCE
authorization codes. A six-digit Gmail OTP must be sent in the JSON body with
its normalized email address.

Codes expire after 10 minutes, allow five invalid attempts, and can be resent after 60 seconds. Treat `401 UNAUTHENTICATED` as invalid/expired and `429 RATE_LIMITED` as resend cooldown. Registration and resend-verification use this same Gmail OTP screen.

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
- Use `?period=week`, `?period=month`, or `?period=quarter` for the analytics series; invalid/missing values default to month.
- Project/BOQ KPIs, analytics, breakdown, highlighted BOQ, activity, recent lists, pending actions, and deliverables currently return temporary populated values with `dataSource: "hardcoded_demo"` and `demoData: true`.
- Notifications, authentication, workspace scope, organization, and permission flags remain real. Never persist demo records or use their IDs in mutations.
- `demoSections` identifies every field that must be replaced when Project/BOQ domain queries are implemented.
- Use `scope.currency` and `scope.timezone` for display formatting.
- Use permission flags for action visibility; never infer capability solely from membership role.

Example:

```ts
const overview = await api.get<DashboardOverview>("/dashboard/overview?period=month");

const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: overview.scope.currency,
});

const estimatedValue = overview.permissions.canViewFinancials && overview.kpis.totalEstimatedValue !== null
  ? money.format(overview.kpis.totalEstimatedValue)
  : null;
```

## 13. Proposals integration

Load the screen header and table independently so filtering does not change the KPI cards:

```ts
const [summary, proposals] = await Promise.all([
  api.get<ProposalSummary>("/proposals/summary"),
  api.get<Page<Proposal>>("/proposals?page=1&pageSize=10&status=sent&search=Oberoi"),
]);
```

Create flows use one endpoint and a `sourceType` discriminator. `sourceId` is required for `boq`, `duplicate`, and `template`. Until the Projects/BOQ/Templates modules are introduced, send the selected UUID plus the visible snapshot label. Do not invent IDs from labels.

```ts
await api.post<Proposal>("/proposals", {
  projectId: selectedProject.id,
  projectName: selectedProject.name,
  clientName: values.clientName,
  sourceType: "boq", // scratch | boq | duplicate | template
  sourceId: selectedBoq.id,
  sourceLabel: selectedBoq.label,
  proposedValue: values.proposedValue,
  expiryDate: values.expiryDate || null,
  internalNotes: values.internalNotes || null,
  scopeItems: values.scopeItems,
});
```

- `GET /proposals/{id}` supplies both the edit form and preview modal.
- Call `POST /proposals/{id}/view` once when an authenticated preview opens; use the returned atomic `viewCount`.
- `GET /proposals/{id}/pdf` returns the proposal as an `application/pdf` attachment. Use a normal navigation/download or fetch it as a Blob; it is not a JSON envelope.
- `PATCH /proposals/{id}` updates allowlisted commercial/snapshot fields.
- `POST /proposals/{id}/status` with `{ status: "sent" }` implements Send to Client; the same endpoint supports `draft`, `approved`, `revisions`, `won`, and `lost`.
- Duplicate by creating a new proposal with `sourceType: "duplicate"` and the original proposal ID. Existing scope items are copied when `scopeItems` is omitted.
- `DELETE /proposals/{id}` archives rather than physically deleting and is owner/admin only.
- Format `proposedValue` with the response `currency`; never submit a currency from browser state.

## 14. Documents integration

The API supports the list and card designs with the same data. View selection is client-only state.

```ts
const root = await api.get<{ items: DocumentFolder[] }>("/document-folders");
const children = await api.get<{ items: DocumentFolder[] }>(`/document-folders?parentId=${folderId}`);
const files = await api.get<Page<Document>>(`/documents?folderId=${folderId}&page=1&pageSize=20`);
```

Folder operations:

- `POST /document-folders` with `{ name, parentId?: null }` creates a root or nested folder.
- `PATCH /document-folders/{id}` renames and/or moves it.
- `DELETE /document-folders/{id}` requires `{ confirmation: exactFolderName }`. It permanently removes descendants and stored files, and is owner/admin only. Use the confirmation checkbox/modal shown in the design.

Upload with browser `FormData`; do not set `Content-Type` manually because the browser must add the multipart boundary:

```ts
const form = new FormData();
form.append("folderId", folderId);
form.append("file", file);
if (project) {
  form.append("projectId", project.id);
  form.append("projectName", project.name);
}

const response = await fetch("/api/v1/documents/upload", {
  method: "POST",
  credentials: "include",
  body: form,
});
```

Uploads are restricted to 25 MB and the allowlisted PDF/image/Office/spreadsheet/CAD/text/ZIP extensions. Files are stored in a private Supabase bucket under a server-derived workspace path.

- `PATCH /documents/{id}` renames, moves, or relinks file metadata.
- `GET /documents/{id}/download` returns a signed URL valid for 60 seconds. Request it only when the user clicks View/Download; never persist it.
- `DELETE /documents/{id}` permanently removes storage and metadata and is owner/admin only.

Role behavior is consistent across both modules: viewer = read, member = read/create/update, owner/admin = all operations including destructive actions. Use `permissions.canCreateProposal`, `canManageDocuments`, `canArchiveProposal`, and `canDeleteDocuments` for button visibility. The backend remains authoritative even if buttons are hidden.

## 15. Invoices integration

Invoices are currently an internal User-workspace feature. This does not change authentication or collapse the three product personas:

1. Admin: future cross-workspace/user/client management.
2. User: current authenticated workspace member who manages clients and invoices.
3. Client: future separately linked identity that can view/pay only its own invoices.

Until Client and Project tables are implemented, submit their selected UUIDs as soft references plus visible snapshot names. Invoice records remain valid commercial snapshots after a client/project name changes. Do not use internal `workspace_memberships` roles to represent a Client.

Load summary cards and the table independently:

```ts
const [summary, page] = await Promise.all([
  api.get<InvoiceSummary>("/invoices/summary"),
  api.get<Page<Invoice>>("/invoices?page=1&pageSize=10&type=invoice&status=overdue"),
]);
```

When rendering the Payments tab inside a project workspace, keep the same invoice
contract and add the project filter:

```ts
const projectInvoices = await api.get<Page<Invoice>>(
  `/invoices?page=1&pageSize=10&type=invoice&projectId=${project.id}`,
);
```

Create or save a draft with the same payload. Currency, line amounts, subtotal, GST, total, paid value, and outstanding value are server-owned:

```ts
const invoice = await api.post<Invoice>("/invoices", {
  type: "invoice", // invoice | pro_forma | quote
  invoiceNumber: values.invoiceNumber || undefined,
  clientId: selectedClient.id,
  clientName: selectedClient.name,
  billingAddress: {
    line1: values.line1,
    line2: values.line2 || null,
    city: values.city,
    state: values.state,
    pincode: values.pincode,
  },
  projectId: selectedProject.id,
  projectName: selectedProject.name,
  issueDate: values.issueDate,
  dueDate: values.dueDate,
  milestone: values.milestone,
  reference: values.reference || null,
  taxRate: 18,
  additionalNotes: values.notes || null,
  bankDetails: workspaceBankDetails || null,
  status: saveAsDraft ? "draft" : "pending",
  items: values.items.map(({ description, quantity, rate }) => ({ description, quantity, rate })),
});
```

- `GET /invoices/{id}` returns preview fields, items, payment history, stored status, and effective status. Effective `overdue` is derived from due date and outstanding balance.
- `GET /invoices?projectId={projectId}` filters the list to invoices, quotes, and pro-formas linked to the selected project. Use this for project payment/invoice tabs instead of client-side filtering.
- `PATCH /invoices/{id}` accepts an allowlisted subset and recalculates totals atomically. Paid/void invoices are locked.
- `POST /invoices/{id}/status` supports `draft`, `pending`, `sent`, `accepted`, and `void`; void is owner/admin-only. “Send to Client” records sent state and timestamp until the communications module exists.
- `POST /invoices/{id}/payments` records cash/bank/card/UPI/cheque/other payments. Overpayment is rejected and status becomes `partial` or `paid` transactionally.
- `GET /invoices/{id}/pdf` returns an `application/pdf` attachment, not a JSON envelope.
- `DELETE /invoices/{id}` archives unpaid invoices and is owner/admin-only. Invoices with payments must be voided instead, preserving their audit trail.

Use `canCreateInvoice`, `canRecordPayment`, and `canDeleteInvoice` for controls. Viewer members are read-only. Import is intentionally not exposed until the Excel/CSV column template and duplicate-number policy are approved.

## 16. Error handling

| Status/code | UI behavior |
|---|---|
| `400 VALIDATION_ERROR` | Map `error.fields` to inputs; show the general message if no field entry exists. |
| `401 UNAUTHENTICATED` | Clear in-memory auth state and redirect to Login. Do not repeatedly call refresh. |
| `403 FORBIDDEN` | Show an access-denied state; do not hide it as “not found” unless the endpoint uses that convention. |
| `409 CONFLICT` | Registration email conflict; show the backend message. |
| `429 RATE_LIMITED` | Disable submission temporarily and show a retry message. |
| `500 INTERNAL_ERROR` | Show a generic retry state and include `requestId` in support/debug UI. |

Never display raw stack traces or Supabase internals. Log the backend `requestId`, not passwords, tokens, or recovery codes.

## 17. Session refresh strategy

Normal API calls and Supabase SSR handle cookie refresh. If an active screen receives a single 401 because the session expired:

1. Call `POST /auth/refresh` once.
2. If refresh succeeds, retry the original GET once.
3. If refresh fails, clear in-memory auth state and route to Login.

Do not retry login, registration, password, or mutation requests automatically. Do not create an infinite refresh loop.

## 18. Production checklist

- Use HTTPS for the frontend/API origin.
- Set `APP_URL`, `PASSWORD_RESET_REDIRECT_URL`, and `EMAIL_VERIFICATION_REDIRECT_URL` to production HTTPS URLs.
- Add only those exact URLs to Supabase Auth's redirect allowlist.
- Keep the API and frontend same-origin unless CORS and cookie policy are intentionally redesigned.
- Apply migrations before deploying the application build.
- Configure Supabase Auth email templates and production rate limits.
- Test two separate users to prove workspace isolation.
- Test owner/admin versus member/viewer financial visibility.
- Verify registration, confirmation, login, refresh, logout, forgot/reset password, profile, onboarding resume, all dashboard periods, demo markers, and financial permission masking.
- Never expose or commit the Supabase service-role key.
- Verify the `workspace-documents` bucket is private and test upload/download/delete with two separate workspaces.
- Test proposal create modes, status changes, duplicate behavior, search/filter pagination, and archive authorization.
- Test invoice total/tax calculations, duplicate manual numbers, overdue derivation, partial/full payments, overpayment rejection, PDF response, and paid-invoice immutability.

## 19. Source files

- API implementation: `app/api/v1/[...path]/route.ts`
- Validation contracts: `lib/api/validation.ts`
- Supabase server client: `lib/supabase/server.ts`
- Database/RLS migration: `supabase/migrations/20260827173000_phase1_auth_user_dashboard.sql`
- Proposals/Documents migration: `supabase/migrations/20260901120000_proposals_documents.sql`
- Invoices migration: `supabase/migrations/20260901150000_invoices.sql`
- OpenAPI: `openapi.yaml`
- Postman assets: `postman/`

## 20. BOQ integration

The BOQ APIs are separate from `boq-imports`. Imports preserve uploaded
spreadsheet data; `/boqs` powers the editable screens shown in the product.

```ts
export const boqApi = {
  list: (query = "") => api.get<Page<Boq>>(`/boqs${query}`),
  detail: (id: string) => api.get<BoqDetail>(`/boqs/${id}`),
  create: (input: CreateBoq) => api.post<Boq>("/boqs", input),
  update: (id: string, input: UpdateBoq) => api.patch<Boq>(`/boqs/${id}`, input),
  setStatus: (id: string, status: "draft" | "in_review" | "approved" | "archived") =>
    api.post<Boq>(`/boqs/${id}/status`, { status }),
  duplicate: (id: string) => api.post<Boq>(`/boqs/${id}/duplicate`),
  templates: () => api.get<Page<BoqTemplate>>("/boq-templates"),
};
```

Create a blank BOQ:

```ts
await boqApi.create({
  projectId: selectedProject.id,
  assignedTo: selectedUser?.id ?? null,
  method: "blank",
  markupPercent: 18,
  taxPercent: 18,
});
```

The API generates `boqNumber` and `version` (`v1`) on create. Do not show them
as editable creation inputs and do not patch `version` later. Legacy callers may
still include those fields, but the backend treats BOQ identity as server-owned.
For the template flow, first load `GET /boq-templates`, then send `method:
"template"` and the selected `templateId`. Save an existing BOQ as a template
with `POST /boq-templates` and `{ name, boqId, description?, tags? }`.

The detail response contains `rooms[].categories[].items[]` and the summary
fields `subtotal`, `markupAmount`, `taxAmount`, and `grandTotal`. Treat all four
as server-owned. Item inputs are `name`, `description`, `unit`, `quantity`,
`rate`, `wastePercent`, and `taxPercent`; the database generates `amount`.

Editor mutation paths:

- `POST /boqs/{boqId}/rooms`
- `PATCH|DELETE /boqs/{boqId}/rooms/{roomId}`
- `POST /boqs/{boqId}/rooms/{roomId}/categories`
- `PATCH|DELETE /boqs/{boqId}/categories/{categoryId}`
- `POST /boqs/{boqId}/categories/{categoryId}/items`
- `PATCH|DELETE /boqs/{boqId}/items/{itemId}`

After every mutation, invalidate both the BOQ detail and BOQ list query. Room,
category, and item deletion is owner/admin-only because it cascades. Sending
for review is available to contributors; approval and archive are owner/admin.

## 21. Costing integration

```ts
export const costingApi = {
  categories: (query = "") => api.get<Page<CostingCategory>>(`/costing/categories${query}`),
  category: (id: string) => api.get<CostingCategoryDetail>(`/costing/categories/${id}`),
  items: (query = "") => api.get<Page<CostingItem>>(`/costing/items${query}`),
  item: (id: string) => api.get<CostingItemDetail>(`/costing/items/${id}`),
  scenarios: () => api.get<Page<CostingScenario>>("/costing/scenarios"),
  analysis: () => api.get<CostAnalysis>("/costing/analysis"),
  margins: () => api.get<MarginAnalysis>("/costing/margins"),
  settings: () => api.get<CostingSettingsHealth>("/costing/settings"),
};
```

Use `parentId` when creating a sub-category. Category defaults use camelCase:
`defaultUnit`, `defaultTaxPercent`, `defaultMarkupPercent`,
`defaultWastePercent`, `transportIncluded`, and `labourIncluded`. List/detail
responses currently expose persisted database fields in snake_case; normalize
them once in the feature adapter if the component model is camelCase.

Costing item margins are calculated from `baseCost` and `sellingRate` on read.
Do not submit a margin. Vendor comparison uses:

```ts
await api.post("/costing/vendor-quotes", {
  itemId, vendorName, quote, leadTimeDays, rating,
});
await api.post(`/costing/vendor-quotes/${quoteId}/selection`, { selected: true });
```

Selecting a quote clears the previous selection for that item. Scenario
adjustments may override an item quantity, rate, or markup. Load the scenario
detail after saving to display backend-derived `baseCost`, `scenarioCost`, and
`savings`. The analysis and margins endpoints are screen aggregates; fetch them
in parallel and invalidate them after item, quote, or scenario mutations.

## 22. Reports & Analytics integration

Reports are owner/admin-only (`canViewReports` and `canExportReports`). Members
and viewers receive `403 FORBIDDEN`; render an access-denied state rather than
zero-valued cards.

```ts
const report = await api.get<ReportsAnalytics>(
  `/reports/analytics?period=${period}`, // month | quarter | year
);
```

The response contains `scope`, `kpis`, chart series, project/pipeline type
groups, team performance, client analysis, and entity counts. Empty arrays mean
there is not yet source data; they are not demo fixtures. Format all currency
with `scope.currency`, and use `scope.generatedAt` for a “last updated” label.

Download PDF as a blob because it is not a JSON envelope:

```ts
const response = await fetch(`/api/v1/reports/analytics/pdf?period=${period}`, {
  credentials: "include",
});
if (!response.ok) throw new Error("Report download failed");
const url = URL.createObjectURL(await response.blob());
const anchor = Object.assign(document.createElement("a"), { href: url, download: "reports-analytics.pdf" });
anchor.click();
URL.revokeObjectURL(url);
```

Never calculate organization revenue or margin from whatever happens to be
loaded in a paginated table. The report endpoint is the authoritative aggregate.

## 23. New-module cache and permissions checklist

- Add `canManageBoq`, `canManageCosting`, `canViewReports`, and
  `canExportReports` to the frontend permission type.
- Use query keys such as `["boqs", filters]`, `["boq", id]`,
  `["costing-items", filters]`, `["costing-analysis"]`, and
  `["reports", period]`.
- Keep workspace IDs out of request bodies and query strings. The API derives
  tenancy from the authenticated Supabase cookie.
- Map `400 VALIDATION_ERROR` field errors to forms, `409 CONFLICT` to duplicate
  BOQ/category/item messages, and `403 FORBIDDEN` to permission UI.
- Apply `20260902090000_boq_costing_reports.sql` before exercising these routes.
