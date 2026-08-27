# Phase 1 implementation notes

## Current backend audit

- Framework: Next.js 15.3 App Router with React 19 and TypeScript 5.8. The repository contained only frontend pages before this phase; no route handlers or separate backend existed.
- Package manager: npm (`package-lock.json`).
- Database/ORM/migrations: none existed. Per the user's follow-up direction, Phase 1 uses Supabase Postgres and timestamped SQL migrations under `supabase/migrations`; no ORM was introduced.
- Auth: none existed. Phase 1 uses Supabase Auth with the official `@supabase/ssr` cookie integration, PKCE recovery codes, Supabase-managed password hashing, refresh-token rotation, verification, revocation, and account status.
- Tenancy/RBAC: none existed. Phase 1 adds `workspaces`, `workspace_memberships`, RLS policies, and server/database-computed permissions. Role labels (`owner`, `admin`, `member`, `viewer`) are an additive baseline because no repository role enum existed.
- Validation/error/logging: none existed. Phase 1 adds strict Zod allowlists, a stable error envelope with request IDs, structured server error logging, and bounded in-memory abuse protection. Supabase Auth also provides auth-event logging and platform rate-limit configuration.
- OpenAPI: none existed. `openapi.yaml` now documents every Phase 1 endpoint.
- Tests/test DB: none existed. Vitest was added for request contracts, permission behavior, pagination/empty states, rate limiting, and migration security invariants. Live Supabase integration tests require project credentials and a disposable Supabase project.

## Figma inspection

### Requested BOQ SaaS file — node `1:2`

- File: `3GYqqZJ8EQaZ14QbESyHEK`, requested node `1:2`.
- `get_design_context` and `get_metadata` were attempted read-only. The connector rejected both because the connected account is not an editor (debug IDs `586235fe-9460-4e21-88aa-4bebdf361cb6` and `04aae789-d5b6-4c0f-b980-2e5d3bd5f443`).
- The connected Figma identity was verified as `diptishgohane04@gmail.com` on a Starter plan.

### PPRD fallback file

- The checked-in PPRD references file `BkGpc3imYGlbx6DeMFBUBN`, node `0:1`.
- Metadata discovery was attempted, but the connected Starter plan had reached its MCP tool-call limit.

### Source-backed mapping used

| Product label/need | API property | Storage | Required |
|---|---|---|---|
| Email | `email` | Supabase `auth.users.email` | register/login: yes |
| Password | `password` / `newPassword` | Supabase Auth only | relevant auth call: yes |
| User display name | `displayName` | `user_profiles.display_name` | no |
| Company name | `company.name` / register `companyName` | `workspaces.name` | onboarding: no |
| Logo reference | `company.logoUrl` | `workspace_profiles.logo_url` | no |
| Website | `company.website` | `workspace_profiles.website` | no |
| Business email | `company.businessEmail` | `workspace_profiles.business_email` | no |
| Phone | `company.phone` | `workspace_profiles.phone` | no |
| Address | `company.address` | `workspace_profiles.address` | no |
| Country | `company.country` | `workspaces.country` | no |
| Currency | `company.currency` | `workspaces.currency` | no; ISO 4217-shaped code |
| Tax ID / GST | `company.taxId` | `workspace_profiles.tax_id` | no |
| Default timezone | `company.timezone` | `workspaces.timezone` | no |
| User timezone/locale | `timezone`, `locale` | `user_preferences` | no |

### Figma gaps

- Exact Auth/Profile/Settings/Onboarding frame names and node IDs, visible labels, required markers, placeholders, helper/validation copy, select options, and dependent-field behavior could not be retrieved.
- No Figma-only fields or enum choices were invented. `displayName` and `companyName` remain optional at registration; the PPRD-backed company fields are optional onboarding updates.
- Email-link verification/recovery uses Supabase's token/code flow; no OTP UI flow was invented.

## Backend changes

- Migration: `20260827173000_phase1_auth_user_dashboard.sql` creates tenant, membership, user profile/preferences, workspace profile, onboarding, notifications, and audit models; indexes; creation trigger; RLS; permission/context/onboarding/dashboard/audit RPCs.
- Auth: register, login, refresh, logout, current identity, forgot/reset password, email verification, and resend verification route handlers.
- User: current profile/context, allowlisted profile update, password change, preferences read/update.
- Onboarding: resumable progress and atomic owner/admin company configuration update.
- Dashboard: permission-aware Overview; real notifications preview/pagination; bounded typed empty-state supporting endpoints for domains not yet implemented.
- Security: workspace scope comes only from `auth.uid()` membership; no workspace/user/role body parameter is accepted. RLS provides a second enforcement layer. Financial values are `null` and cost overview is omitted for non-financial roles.
- Failure isolation: deferred domains are independent typed empty sections with `unavailableSections`; internal RPC failures are correlated and do not expose stack traces.

## Operational setup

1. Create a Supabase project and copy `.env.example` to `.env.local` with its URL, publishable key, and the frontend-owned verification/recovery redirect URLs.
2. Apply migrations with the Supabase CLI (`supabase db push`) or run the SQL migration in a controlled project.
3. Configure the Supabase Auth site URL/redirect allowlist for `APP_URL` and configure production Auth rate limits in the Supabase dashboard. The in-process limiter is defense-in-depth only and is not shared across serverless instances.
4. Use the generated API routes under `/api/v1`; authenticated sessions are maintained with Supabase SSR cookies.

## Deferred

- Client and Super Admin.
- Full Project/Room, BOQ, costing, approvals, deliverables, documents, proposals, invoices, integrations, billing, and support modules.
- Populated dashboard queries for deferred domain tables. The Overview contract is stable and explicitly reports those sources as deferred.
- Live migration/auth/tenant integration tests until a disposable Supabase project and credentials are available.
- Final Figma field reconciliation until the connected account has access/quota.

Frontend files modified: NO
