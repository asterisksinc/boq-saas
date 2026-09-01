import { type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EmailOtpError, issueEmailOtp, verifyEmailOtp } from "@/lib/auth/email-otp";
import { pagination } from "@/lib/domain/dashboard";
import { dashboardPeriod, demoDashboard, demoPendingActions, demoRecentBoqs, demoRecentProjects, demoUpcomingDeliverables } from "@/lib/domain/dashboard-demo";
import { consumeRateLimit, rateLimitKey } from "@/lib/api/rate-limit";
import { fail, methodNotAllowed, ok, requestId } from "@/lib/api/response";
import {
  changePasswordSchema,
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  onboardingPatchSchema,
  preferencesPatchSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  userPatchSchema,
  verifyEmailSchema,
  verifyEmailOtpSchema,
  documentPatchSchema,
  folderCreateSchema,
  folderDeleteSchema,
  folderPatchSchema,
  proposalCreateSchema,
  proposalPatchSchema,
  proposalStatusSchema,
  invoiceCreateSchema,
  invoicePatchSchema,
  invoiceStatusSchema,
  paymentCreateSchema,
} from "@/lib/api/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ path: string[] }> };

async function body(request: Request) {
  try { return await request.json(); } catch { return null; }
}

async function parsed<T extends z.ZodType>(request: Request, schema: T, id: string) {
  const result = schema.safeParse(await body(request));
  if (!result.success) return { response: fail("VALIDATION_ERROR", "Request validation failed.", 400, id, fieldErrors(result.error)) };
  return { data: result.data as z.infer<T> };
}

async function requireUser(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { response: fail("UNAUTHENTICATED", "Authentication required.", 401, id) };
  return { user: data.user };
}

async function context(supabase: SupabaseClient, id: string) {
  const auth = await requireUser(supabase, id);
  if (auth.response) return auth;
  const { data, error } = await supabase.rpc("get_current_context");
  if (error) {
    console.error(JSON.stringify({ requestId: id, event: "current_context_failed", code: error.code }));
    return { response: fail("INTERNAL_ERROR", "Unable to load workspace context.", 500, id) };
  }
  return { user: auth.user, data };
}

function limited(request: Request, action: string, id: string, limit = 5) {
  const result = consumeRateLimit(rateLimitKey(request, action), limit, 15 * 60_000);
  return result.allowed ? null : fail("RATE_LIMITED", "Too many attempts. Try again later.", 429, id);
}

async function audit(supabase: SupabaseClient, action: string, id: string) {
  const { error } = await supabase.rpc("write_audit", { p_action: action, p_request_id: id });
  if (error) console.error(JSON.stringify({ requestId: id, event: "audit_write_failed", code: error.code }));
}

function emailOtpFailure(error: unknown, id: string) {
  if (error instanceof EmailOtpError && error.code === "RATE_LIMITED") {
    return fail("RATE_LIMITED", error.message, 429, id);
  }
  if (error instanceof EmailOtpError && error.code === "INVALID_OTP") {
    return fail("UNAUTHENTICATED", "Invalid or expired OTP.", 401, id);
  }
  console.error(JSON.stringify({
    requestId: id,
    event: "custom_email_otp_failed",
    reason: error instanceof Error ? error.message : "unknown",
  }));
  return fail("OTP_SEND_FAILED", "Gmail could not send the OTP. Check the SMTP configuration.", 500, id);
}

async function register(request: Request, supabase: SupabaseClient, id: string) {
  const blocked = limited(request, "register", id, 8); if (blocked) return blocked;
  const input = await parsed(request, registerSchema, id); if (input.response) return input.response;
  let admin;
  try { admin = createSupabaseAdminClient(); }
  catch (error) { return emailOtpFailure(error, id); }
  const { data, error } = await admin.auth.admin.createUser({
    email: input.data.email,
    password: input.data.password,
    email_confirm: false,
    user_metadata: { display_name: input.data.displayName, company_name: input.data.companyName },
  });
  if (error) {
    const duplicate = /already|registered|exists/i.test(error.message);
    return fail(duplicate ? "CONFLICT" : "VALIDATION_ERROR", duplicate ? "An account with this email already exists." : "Registration could not be completed.", duplicate ? 409 : 400, id);
  }
  try { await issueEmailOtp(input.data.email, data.user.id); }
  catch (otpError) { return emailOtpFailure(otpError, id); }
  return ok({
    user: { id: data.user.id, email: data.user.email },
    emailVerificationRequired: true,
    otpSent: true,
    message: "A 6-digit verification code has been sent through Gmail.",
  }, 201, id);
}

async function login(request: Request, supabase: SupabaseClient, id: string) {
  const blocked = limited(request, "login", id, 10); if (blocked) return blocked;
  const input = await parsed(request, loginSchema, id); if (input.response) return input.response;

  if (!("password" in input.data) && !("otp" in input.data)) {
    try { await issueEmailOtp(input.data.email); }
    catch (error) { return emailOtpFailure(error, id); }
    return ok({ otpSent: true, message: "A 6-digit login code has been sent through Gmail." }, 200, id);
  }

  let result;
  if ("otp" in input.data) {
    let userId: string;
    try { userId = await verifyEmailOtp(input.data.email, input.data.otp); }
    catch (error) { return emailOtpFailure(error, id); }
    const admin = createSupabaseAdminClient();
    const confirmed = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (confirmed.error) return fail("INTERNAL_ERROR", "Account verification could not be completed.", 500, id);
    const link = await admin.auth.admin.generateLink({ type: "magiclink", email: input.data.email });
    const tokenHash = link.data?.properties?.hashed_token;
    if (link.error || !tokenHash) return fail("INTERNAL_ERROR", "Login session could not be created.", 500, id);
    result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  } else {
    result = await supabase.auth.signInWithPassword(input.data);
  }
  const { data, error } = result;
  if (error || !data.user) {
    return fail("UNAUTHENTICATED", "otp" in input.data ? "Invalid or expired OTP." : "Invalid email or password.", 401, id);
  }
  const ctx = await context(supabase, id); if ("response" in ctx) return ctx.response;
  await audit(supabase, "auth.login.succeeded", id);
  return ok({ user: { id: data.user.id, email: data.user.email }, context: ctx.data }, 200, id);
}

async function refresh(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) return fail("UNAUTHENTICATED", "Session is expired or revoked.", 401, id);
  return ok({ expiresAt: data.session.expires_at }, 200, id);
}

async function logout(supabase: SupabaseClient, id: string) {
  const { data } = await supabase.auth.getUser();
  if (data.user) await audit(supabase, "auth.logout", id);
  await supabase.auth.signOut({ scope: "local" });
  return ok({ loggedOut: true }, 200, id);
}

async function forgotPassword(request: Request, supabase: SupabaseClient, id: string) {
  const blocked = limited(request, "forgot-password", id, 5); if (blocked) return blocked;
  const input = await parsed(request, forgotPasswordSchema, id); if (input.response) return input.response;
  const redirectTo = process.env.PASSWORD_RESET_REDIRECT_URL ?? `${process.env.APP_URL ?? new URL(request.url).origin}/reset-password`;
  await supabase.auth.resetPasswordForEmail(input.data.email, { redirectTo });
  return ok({ message: "If an account exists, password reset instructions have been sent." }, 200, id);
}

async function resetPassword(request: Request, supabase: SupabaseClient, id: string) {
  const blocked = limited(request, "reset-password", id, 8); if (blocked) return blocked;
  const input = await parsed(request, resetPasswordSchema, id); if (input.response) return input.response;
  const exchanged = await supabase.auth.exchangeCodeForSession(input.data.code);
  if (exchanged.error) return fail("VALIDATION_ERROR", "Reset link is invalid, expired, or already used.", 400, id);
  const updated = await supabase.auth.updateUser({ password: input.data.password });
  if (updated.error) return fail("VALIDATION_ERROR", "Password could not be updated.", 400, id);
  await supabase.auth.signOut({ scope: "others" });
  await audit(supabase, "auth.password.reset", id);
  return ok({ passwordReset: true }, 200, id);
}

async function verifyEmail(request: NextRequest, supabase: SupabaseClient, id: string) {
  const code = request.nextUrl.searchParams.get("code");
  if (request.method === "GET" && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail("VALIDATION_ERROR", "Verification link is invalid or expired.", 400, id);
    await audit(supabase, "auth.email.verified", id);
    return ok({ verified: true }, 200, id);
  }
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const source = request.method === "GET" ? { tokenHash, type } : await body(request);
  const otpInput = verifyEmailOtpSchema.safeParse(source);
  if (otpInput.success) {
    let userId: string;
    try { userId = await verifyEmailOtp(otpInput.data.email, otpInput.data.otp); }
    catch (error) {
      if (error instanceof EmailOtpError && error.code === "INVALID_OTP") {
        return fail("VALIDATION_ERROR", "Verification code is invalid or expired.", 400, id);
      }
      return emailOtpFailure(error, id);
    }
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (error) return fail("INTERNAL_ERROR", "Account verification could not be completed.", 500, id);
    return ok({ verified: true }, 200, id);
  }
  const input = verifyEmailSchema.safeParse(source);
  if (!input.success) return fail("VALIDATION_ERROR", "Verification link is invalid.", 400, id, fieldErrors(input.error));
  const { error } = await supabase.auth.verifyOtp({ token_hash: input.data.tokenHash, type: input.data.type });
  if (error) return fail("VALIDATION_ERROR", "Verification link is invalid or expired.", 400, id);
  await audit(supabase, "auth.email.verified", id);
  return ok({ verified: true }, 200, id);
}

async function resendVerification(request: Request, supabase: SupabaseClient, id: string) {
  const blocked = limited(request, "resend-verification", id, 4); if (blocked) return blocked;
  const input = await parsed(request, resendVerificationSchema, id); if (input.response) return input.response;
  try { await issueEmailOtp(input.data.email); }
  catch (error) { return emailOtpFailure(error, id); }
  return ok({ message: "If verification is pending, a new Gmail OTP has been sent." }, 200, id);
}

async function getMe(supabase: SupabaseClient, id: string) {
  const ctx = await context(supabase, id); if ("response" in ctx) return ctx.response;
  return ok(ctx.data, 200, id);
}

async function patchUser(request: Request, supabase: SupabaseClient, id: string) {
  const auth = await requireUser(supabase, id); if (auth.response) return auth.response;
  const input = await parsed(request, userPatchSchema, id); if (input.response) return input.response;
  const { data, error } = await supabase.from("user_profiles").update({ display_name: input.data.displayName }).eq("user_id", auth.user.id).select("user_id,display_name,avatar_url,updated_at").single();
  if (error) return fail("VALIDATION_ERROR", "Profile could not be updated.", 400, id);
  await audit(supabase, "user.profile.updated", id);
  return ok(data, 200, id);
}

async function changePassword(request: Request, supabase: SupabaseClient, id: string) {
  const auth = await requireUser(supabase, id); if (auth.response) return auth.response;
  const input = await parsed(request, changePasswordSchema, id); if (input.response) return input.response;
  if (!auth.user.email) return fail("VALIDATION_ERROR", "Password authentication is unavailable for this account.", 400, id);
  const verified = await supabase.auth.signInWithPassword({ email: auth.user.email, password: input.data.currentPassword });
  if (verified.error) return fail("UNAUTHENTICATED", "Current password is incorrect.", 401, id);
  const updated = await supabase.auth.updateUser({ password: input.data.newPassword });
  if (updated.error) return fail("VALIDATION_ERROR", "Password could not be updated.", 400, id);
  await supabase.auth.signOut({ scope: "others" });
  await audit(supabase, "auth.password.changed", id);
  return ok({ passwordChanged: true }, 200, id);
}

async function preferences(request: Request, supabase: SupabaseClient, id: string) {
  const auth = await requireUser(supabase, id); if (auth.response) return auth.response;
  if (request.method === "GET") {
    const { data, error } = await supabase.from("user_preferences").select("timezone,locale,updated_at").eq("user_id", auth.user.id).single();
    return error ? fail("INTERNAL_ERROR", "Preferences could not be loaded.", 500, id) : ok(data, 200, id);
  }
  const input = await parsed(request, preferencesPatchSchema, id); if (input.response) return input.response;
  const values = { ...(input.data.timezone ? { timezone: input.data.timezone } : {}), ...(input.data.locale ? { locale: input.data.locale } : {}) };
  const { data, error } = await supabase.from("user_preferences").update(values).eq("user_id", auth.user.id).select("timezone,locale,updated_at").single();
  return error ? fail("VALIDATION_ERROR", "Preferences could not be updated.", 400, id) : ok(data, 200, id);
}

async function onboarding(request: Request, supabase: SupabaseClient, id: string) {
  const ctx = await context(supabase, id); if ("response" in ctx) return ctx.response;
  if (request.method === "GET") return ok((ctx.data as { onboarding?: unknown })?.onboarding ?? null, 200, id);
  const input = await parsed(request, onboardingPatchSchema, id); if (input.response) return input.response;
  const { data, error } = await supabase.rpc("update_onboarding", { p_patch: input.data });
  if (error) return fail("VALIDATION_ERROR", "Onboarding state could not be updated.", 400, id);
  await audit(supabase, "onboarding.updated", id);
  return ok(data, 200, id);
}

async function dashboardOverview(request: NextRequest, supabase: SupabaseClient, id: string) {
  const auth = await requireUser(supabase, id); if (auth.response) return auth.response;
  const { data, error } = await supabase.rpc("get_dashboard_overview");
  if (error) {
    console.error(JSON.stringify({ requestId: id, event: "dashboard_overview_failed", code: error.code }));
    return fail("INTERNAL_ERROR", "Dashboard overview is temporarily unavailable.", 500, id);
  }
  const base = (data ?? {}) as Record<string, unknown>;
  const scope = (base.scope ?? {}) as { currency?: string };
  const permissions = (base.permissions ?? {}) as { canViewFinancials?: boolean };
  const demo = demoDashboard(dashboardPeriod(request.nextUrl.searchParams.get("period")), scope.currency ?? "INR", permissions.canViewFinancials === true);
  // TODO(PROJECT_BOQ_BACKEND): Remove this merge once get_dashboard_overview
  // returns real Project/BOQ/Costing/Workflow aggregates.
  return ok({ ...base, ...demo, scope: base.scope, organization: base.organization, permissions: base.permissions, notifications: base.notifications }, 200, id);
}

async function dashboardList(request: NextRequest, supabase: SupabaseClient, id: string, name: string) {
  const ctx = await context(supabase, id); if ("response" in ctx) return ctx.response;
  const dashboardContext = ctx.data as { workspace?: { id?: string }; permissions?: { canViewFinancials?: boolean } } | null;
  const workspaceId = dashboardContext?.workspace?.id;
  if (!workspaceId) return fail("FORBIDDEN", "Active workspace membership required.", 403, id);
  const { page, pageSize, from, to } = pagination(request.nextUrl.searchParams);
  if (name !== "notifications") {
    // TODO(PROJECT_BOQ_BACKEND): Replace these demo pages with tenant-scoped
    // Project/BOQ/Workflow/Deliverable queries when those tables are available.
    const demoItems: Record<string, unknown[]> = {
      "recent-projects": demoRecentProjects,
      "recent-boqs": demoRecentBoqs,
      "pending-actions": demoPendingActions,
      "upcoming-deliverables": demoUpcomingDeliverables,
    };
    const all = name === "recent-boqs" && dashboardContext?.permissions?.canViewFinancials !== true
      ? (demoItems[name] ?? []).map((item) => ({ ...(item as Record<string, unknown>), value: null }))
      : demoItems[name] ?? [];
    return ok({ items: all.slice(from, to + 1), page, pageSize, total: all.length, hasMore: to + 1 < all.length, dataSource: "hardcoded_demo", demoData: true }, 200, id);
  }
  const countQuery = supabase.from("notifications").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId);
  const itemsQuery = supabase.from("notifications").select("id,type,title,priority,target_type,target_id,read_at,created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).range(from, to);
  const [count, items] = await Promise.all([countQuery, itemsQuery]);
  if (count.error || items.error) return fail("INTERNAL_ERROR", "Notifications could not be loaded.", 500, id);
  const total = count.count ?? 0;
  return ok({ items: items.data ?? [], page, pageSize, total, hasMore: to + 1 < total }, 200, id);
}

type WorkspaceAccess = { userId: string; workspaceId: string; role: "owner" | "admin" | "member" | "viewer"; currency: string };

async function workspaceAccess(supabase: SupabaseClient, id: string, write = false, admin = false) {
  const ctx = await context(supabase, id);
  if ("response" in ctx) return ctx;
  const value = ctx.data as {
    workspace?: { id?: string; currency?: string };
    membership?: { role?: WorkspaceAccess["role"] };
  } | null;
  const workspaceId = value?.workspace?.id;
  const role = value?.membership?.role;
  if (!workspaceId || !role) return { response: fail("FORBIDDEN", "Active workspace membership required.", 403, id) };
  if ((write && role === "viewer") || (admin && !["owner", "admin"].includes(role))) {
    return { response: fail("FORBIDDEN", "Your workspace role cannot perform this action.", 403, id) };
  }
  return { access: { userId: ctx.user.id, workspaceId, role, currency: value?.workspace?.currency ?? "INR" } satisfies WorkspaceAccess };
}

function proposalDto(row: Record<string, unknown>) {
  return {
    id: row.id, proposalCode: row.proposal_code, projectId: row.project_id, projectName: row.project_name,
    clientName: row.client_name, sourceType: row.source_type, sourceId: row.source_id, sourceLabel: row.source_label,
    proposedValue: Number(row.proposed_value), currency: row.currency, expiryDate: row.expiry_date,
    internalNotes: row.internal_notes, scopeItems: row.scope_items ?? [], status: row.status,
    viewCount: row.view_count, sentAt: row.sent_at, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

const proposalSelect = "id,proposal_code,project_id,project_name,client_name,source_type,source_id,source_label,proposed_value,currency,expiry_date,internal_notes,scope_items,status,view_count,sent_at,created_at,updated_at";

async function listProposals(request: NextRequest, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { page, pageSize, from, to } = pagination(request.nextUrl.searchParams);
  const status = request.nextUrl.searchParams.get("status");
  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 120);
  let query = supabase.from("proposals").select(proposalSelect, { count: "exact" })
    .eq("workspace_id", scoped.access.workspaceId).is("archived_at", null).order("updated_at", { ascending: false }).range(from, to);
  if (status && ["draft","sent","approved","revisions","won","lost"].includes(status)) query = query.eq("status", status);
  if (search) {
    const safe = search.replace(/[%_,()]/g, " ");
    query = query.or(`proposal_code.ilike.%${safe}%,project_name.ilike.%${safe}%,client_name.ilike.%${safe}%`);
  }
  const result = await query;
  if (result.error) return fail("INTERNAL_ERROR", "Proposals could not be loaded.", 500, id);
  const total = result.count ?? 0;
  return ok({ items: (result.data ?? []).map((row) => proposalDto(row as Record<string, unknown>)), page, pageSize, total, hasMore: to + 1 < total }, 200, id);
}

async function proposalSummary(supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { data, error } = await supabase.from("proposals").select("status,proposed_value,sent_at,expiry_date")
    .eq("workspace_id", scoped.access.workspaceId).is("archived_at", null);
  if (error) return fail("INTERNAL_ERROR", "Proposal summary could not be loaded.", 500, id);
  const rows = data ?? [];
  const sent = rows.filter((row) => row.status === "sent");
  const responded = rows.filter((row) => ["approved","revisions","won","lost"].includes(row.status));
  return ok({
    total: rows.length,
    totalSent: sent.length,
    winRate: responded.length ? Math.round((rows.filter((row) => row.status === "won").length / responded.length) * 10000) / 100 : 0,
    averageValue: rows.length ? rows.reduce((sum, row) => sum + Number(row.proposed_value), 0) / rows.length : 0,
    pendingResponse: sent.length,
    currency: scoped.access.currency,
  }, 200, id);
}

async function createProposal(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, proposalCreateSchema, id); if (input.response) return input.response;
  let scopeItems = input.data.scopeItems ?? [];
  if (input.data.sourceType === "duplicate" && input.data.sourceId && !input.data.scopeItems) {
    const original = await supabase.from("proposals").select("scope_items").eq("workspace_id", scoped.access.workspaceId).eq("id", input.data.sourceId).is("archived_at", null).single();
    if (original.error) return fail("NOT_FOUND", "Source proposal was not found.", 404, id);
    scopeItems = original.data.scope_items ?? [];
  }
  const values = {
    workspace_id: scoped.access.workspaceId, project_id: input.data.projectId ?? null, project_name: input.data.projectName,
    client_name: input.data.clientName, source_type: input.data.sourceType, source_id: input.data.sourceId ?? null,
    source_label: input.data.sourceLabel ?? null, proposed_value: input.data.proposedValue, currency: scoped.access.currency,
    expiry_date: input.data.expiryDate ?? null, internal_notes: input.data.internalNotes ?? null, scope_items: scopeItems,
    created_by: scoped.access.userId, updated_by: scoped.access.userId,
  };
  const { data, error } = await supabase.from("proposals").insert(values).select(proposalSelect).single();
  if (error) return fail("VALIDATION_ERROR", "Proposal could not be created.", 400, id);
  await audit(supabase, "proposal.created", id);
  return ok(proposalDto(data as Record<string, unknown>), 201, id);
}

async function getProposal(supabase: SupabaseClient, id: string, proposalId: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { data, error } = await supabase.from("proposals").select(proposalSelect).eq("workspace_id", scoped.access.workspaceId).eq("id", proposalId).is("archived_at", null).single();
  return error ? fail("NOT_FOUND", "Proposal was not found.", 404, id) : ok(proposalDto(data as Record<string, unknown>), 200, id);
}

function pdfEscape(value: unknown) {
  return String(value ?? "").normalize("NFKD").replace(/[^\x20-\x7e]/g, "").replace(/([\\()])/g, "\\$1");
}

function basicProposalPdf(proposal: ReturnType<typeof proposalDto>) {
  const lines = [
    `${proposal.proposalCode} - Proposal`,
    `Project: ${proposal.projectName}`,
    `Prepared for: ${proposal.clientName}`,
    `Status: ${proposal.status}`,
    `Proposed value: ${proposal.currency} ${Number(proposal.proposedValue).toFixed(2)}`,
    `Expiry: ${proposal.expiryDate ?? "Not set"}`,
    "",
    "Scope includes",
    ...((proposal.scopeItems as unknown[]) ?? []).slice(0, 20).map((item) => `- ${item}`),
    "",
    `Grand total: ${proposal.currency} ${Number(proposal.proposedValue).toFixed(2)}`,
  ];
  const commands = lines.map((line, index) => `BT /F1 ${index === 0 ? 18 : 11} Tf 50 ${770 - index * 24} Td (${pdfEscape(line).slice(0, 105)}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(commands, "ascii")} >>\nstream\n${commands}\nendstream`,
  ];
  let output = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(output, "ascii")); output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(output, "ascii");
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\n`;
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Uint8Array(Buffer.from(output, "ascii"));
}

async function proposalPdf(supabase: SupabaseClient, id: string, proposalId: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { data, error } = await supabase.from("proposals").select(proposalSelect).eq("workspace_id", scoped.access.workspaceId).eq("id", proposalId).is("archived_at", null).single();
  if (error) return fail("NOT_FOUND", "Proposal was not found.", 404, id);
  const proposal = proposalDto(data as Record<string, unknown>);
  return new Response(basicProposalPdf(proposal), { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=\"${pdfEscape(proposal.proposalCode)}.pdf\"`, "Cache-Control": "private, no-store", "X-Request-Id": id } });
}

async function recordProposalView(supabase: SupabaseClient, id: string, proposalId: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { data, error } = await supabase.rpc("record_proposal_view", { p_proposal_id: proposalId });
  return error ? fail("NOT_FOUND", "Proposal was not found.", 404, id) : ok({ viewCount: data }, 200, id);
}

async function updateProposal(request: Request, supabase: SupabaseClient, id: string, proposalId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, proposalPatchSchema, id); if (input.response) return input.response;
  const patch = input.data;
  const values = {
    ...(patch.projectId !== undefined ? { project_id: patch.projectId } : {}), ...(patch.projectName !== undefined ? { project_name: patch.projectName } : {}),
    ...(patch.clientName !== undefined ? { client_name: patch.clientName } : {}), ...(patch.proposedValue !== undefined ? { proposed_value: patch.proposedValue } : {}),
    ...(patch.expiryDate !== undefined ? { expiry_date: patch.expiryDate } : {}), ...(patch.internalNotes !== undefined ? { internal_notes: patch.internalNotes } : {}),
    ...(patch.scopeItems !== undefined ? { scope_items: patch.scopeItems } : {}), updated_by: scoped.access.userId,
  };
  const { data, error } = await supabase.from("proposals").update(values).eq("workspace_id", scoped.access.workspaceId).eq("id", proposalId).is("archived_at", null).select(proposalSelect).single();
  if (error) return fail("NOT_FOUND", "Proposal was not found or could not be updated.", 404, id);
  await audit(supabase, "proposal.updated", id);
  return ok(proposalDto(data as Record<string, unknown>), 200, id);
}

async function changeProposalStatus(request: Request, supabase: SupabaseClient, id: string, proposalId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, proposalStatusSchema, id); if (input.response) return input.response;
  const values = { status: input.data.status, updated_by: scoped.access.userId, ...(input.data.status === "sent" ? { sent_at: new Date().toISOString() } : {}) };
  const { data, error } = await supabase.from("proposals").update(values).eq("workspace_id", scoped.access.workspaceId).eq("id", proposalId).is("archived_at", null).select(proposalSelect).single();
  if (error) return fail("NOT_FOUND", "Proposal was not found.", 404, id);
  await audit(supabase, `proposal.${input.data.status}`, id);
  return ok(proposalDto(data as Record<string, unknown>), 200, id);
}

async function archiveProposal(supabase: SupabaseClient, id: string, proposalId: string) {
  const scoped = await workspaceAccess(supabase, id, true, true); if ("response" in scoped) return scoped.response;
  const { error } = await supabase.from("proposals").update({ archived_at: new Date().toISOString(), updated_by: scoped.access.userId })
    .eq("workspace_id", scoped.access.workspaceId).eq("id", proposalId).is("archived_at", null).select("id").single();
  if (error) return fail("NOT_FOUND", "Proposal was not found.", 404, id);
  await audit(supabase, "proposal.archived", id);
  return ok({ archived: true }, 200, id);
}

function folderDto(row: Record<string, unknown>, itemCount = 0, sizeBytes = 0) {
  return { id: row.id, parentId: row.parent_id, name: row.name, itemCount, sizeBytes, createdAt: row.created_at, updatedAt: row.updated_at };
}

function documentDto(row: Record<string, unknown>) {
  return { id: row.id, folderId: row.folder_id, proposalId: row.proposal_id, projectId: row.project_id, projectName: row.project_name,
    name: row.name, mimeType: row.mime_type, sizeBytes: Number(row.size_bytes), createdAt: row.created_at, updatedAt: row.updated_at };
}

async function listFolders(request: NextRequest, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const parentId = request.nextUrl.searchParams.get("parentId");
  let foldersQuery = supabase.from("document_folders").select("id,parent_id,name,created_at,updated_at").eq("workspace_id", scoped.access.workspaceId).order("updated_at", { ascending: false });
  foldersQuery = parentId ? foldersQuery.eq("parent_id", parentId) : foldersQuery.is("parent_id", null);
  const folders = await foldersQuery;
  if (folders.error) return fail("INTERNAL_ERROR", "Folders could not be loaded.", 500, id);
  const ids = (folders.data ?? []).map((folder) => folder.id);
  const docs = ids.length ? await supabase.from("documents").select("folder_id,size_bytes").eq("workspace_id", scoped.access.workspaceId).in("folder_id", ids) : { data: [], error: null };
  if (docs.error) return fail("INTERNAL_ERROR", "Folder totals could not be loaded.", 500, id);
  return ok({ items: (folders.data ?? []).map((folder) => {
    const children = (docs.data ?? []).filter((doc) => doc.folder_id === folder.id);
    return folderDto(folder as Record<string, unknown>, children.length, children.reduce((sum, doc) => sum + Number(doc.size_bytes), 0));
  }) }, 200, id);
}

async function createFolder(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, folderCreateSchema, id); if (input.response) return input.response;
  if (input.data.parentId) {
    const parent = await supabase.from("document_folders").select("id").eq("workspace_id", scoped.access.workspaceId).eq("id", input.data.parentId).single();
    if (parent.error) return fail("NOT_FOUND", "Parent folder was not found.", 404, id);
  }
  const { data, error } = await supabase.from("document_folders").insert({ workspace_id: scoped.access.workspaceId, parent_id: input.data.parentId ?? null,
    name: input.data.name, created_by: scoped.access.userId, updated_by: scoped.access.userId }).select("id,parent_id,name,created_at,updated_at").single();
  if (error) return fail(error.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR", error.code === "23505" ? "A folder with this name already exists here." : "Folder could not be created.", error.code === "23505" ? 409 : 400, id);
  await audit(supabase, "document_folder.created", id);
  return ok(folderDto(data as Record<string, unknown>), 201, id);
}

async function updateFolder(request: Request, supabase: SupabaseClient, id: string, folderId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, folderPatchSchema, id); if (input.response) return input.response;
  if (input.data.parentId === folderId) return fail("VALIDATION_ERROR", "A folder cannot be its own parent.", 400, id);
  if (input.data.parentId) {
    const parent = await supabase.from("document_folders").select("id,parent_id").eq("workspace_id", scoped.access.workspaceId).eq("id", input.data.parentId).single();
    if (parent.error) return fail("NOT_FOUND", "Parent folder was not found.", 404, id);
    try {
      const descendants = await descendantFolderIds(supabase, scoped.access.workspaceId, folderId);
      if (descendants.includes(input.data.parentId)) return fail("VALIDATION_ERROR", "A folder cannot be moved into its own descendant.", 400, id);
    } catch { return fail("INTERNAL_ERROR", "Folder hierarchy could not be validated.", 500, id); }
  }
  const values = { ...(input.data.name !== undefined ? { name: input.data.name } : {}), ...(input.data.parentId !== undefined ? { parent_id: input.data.parentId } : {}), updated_by: scoped.access.userId };
  const { data, error } = await supabase.from("document_folders").update(values).eq("workspace_id", scoped.access.workspaceId).eq("id", folderId).select("id,parent_id,name,created_at,updated_at").single();
  if (error) return fail(error.code === "23505" ? "CONFLICT" : "NOT_FOUND", error.code === "23505" ? "A folder with this name already exists here." : "Folder was not found.", error.code === "23505" ? 409 : 404, id);
  await audit(supabase, "document_folder.updated", id);
  return ok(folderDto(data as Record<string, unknown>), 200, id);
}

async function descendantFolderIds(supabase: SupabaseClient, workspaceId: string, rootId: string) {
  const ids = [rootId];
  for (let cursor = 0; cursor < ids.length && ids.length <= 1000; cursor += 1) {
    const result = await supabase.from("document_folders").select("id").eq("workspace_id", workspaceId).eq("parent_id", ids[cursor]);
    if (result.error) throw result.error;
    for (const row of result.data ?? []) if (!ids.includes(row.id)) ids.push(row.id);
  }
  return ids;
}

async function deleteFolder(request: Request, supabase: SupabaseClient, id: string, folderId: string) {
  const scoped = await workspaceAccess(supabase, id, true, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, folderDeleteSchema, id); if (input.response) return input.response;
  const folder = await supabase.from("document_folders").select("id,name").eq("workspace_id", scoped.access.workspaceId).eq("id", folderId).single();
  if (folder.error) return fail("NOT_FOUND", "Folder was not found.", 404, id);
  if (input.data.confirmation !== folder.data.name) return fail("VALIDATION_ERROR", "Folder name confirmation does not match.", 400, id);
  let folderIds: string[];
  try { folderIds = await descendantFolderIds(supabase, scoped.access.workspaceId, folderId); }
  catch { return fail("INTERNAL_ERROR", "Folder contents could not be resolved.", 500, id); }
  const files = await supabase.from("documents").select("storage_path").eq("workspace_id", scoped.access.workspaceId).in("folder_id", folderIds);
  if (files.error) return fail("INTERNAL_ERROR", "Folder contents could not be loaded.", 500, id);
  const paths = (files.data ?? []).map((file) => file.storage_path);
  if (paths.length) {
    const storage = createSupabaseAdminClient().storage.from("workspace-documents");
    for (let offset = 0; offset < paths.length; offset += 100) {
      const removed = await storage.remove(paths.slice(offset, offset + 100));
      if (removed.error) return fail("INTERNAL_ERROR", "Stored files could not be deleted.", 500, id);
    }
  }
  const deleted = await supabase.from("document_folders").delete().eq("workspace_id", scoped.access.workspaceId).eq("id", folderId);
  if (deleted.error) return fail("INTERNAL_ERROR", "Folder could not be deleted.", 500, id);
  await audit(supabase, "document_folder.deleted", id);
  return ok({ deleted: true, filesDeleted: paths.length }, 200, id);
}

async function listDocuments(request: NextRequest, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const folderId = request.nextUrl.searchParams.get("folderId");
  if (!folderId) return fail("VALIDATION_ERROR", "folderId is required.", 400, id);
  const { page, pageSize, from, to } = pagination(request.nextUrl.searchParams);
  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 120);
  let query = supabase.from("documents").select("id,folder_id,proposal_id,project_id,project_name,name,mime_type,size_bytes,created_at,updated_at", { count: "exact" })
    .eq("workspace_id", scoped.access.workspaceId).eq("folder_id", folderId).order("updated_at", { ascending: false }).range(from, to);
  if (search) query = query.ilike("name", `%${search.replace(/[%_]/g, " ")}%`);
  const result = await query;
  if (result.error) return fail("INTERNAL_ERROR", "Documents could not be loaded.", 500, id);
  const total = result.count ?? 0;
  return ok({ items: (result.data ?? []).map((row) => documentDto(row as Record<string, unknown>)), page, pageSize, total, hasMore: to + 1 < total }, 200, id);
}

const allowedDocumentExtensions = new Set(["pdf","png","jpg","jpeg","webp","doc","docx","xls","xlsx","csv","dwg","dxf","txt","zip"]);

async function uploadDocument(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  let form: FormData;
  try { form = await request.formData(); } catch { return fail("VALIDATION_ERROR", "A multipart upload is required.", 400, id); }
  const file = form.get("file");
  const folderId = String(form.get("folderId") ?? "");
  if (!(file instanceof File) || !z.string().uuid().safeParse(folderId).success) return fail("VALIDATION_ERROR", "file and a valid folderId are required.", 400, id);
  if (file.size < 1 || file.size > 25 * 1024 * 1024) return fail("VALIDATION_ERROR", "File size must be between 1 byte and 25 MB.", 400, id);
  const safeName = file.name.replace(/[\\/\u0000-\u001f]/g, "_").trim().slice(0, 255);
  const extension = safeName.includes(".") ? safeName.split(".").pop()!.toLowerCase() : "";
  if (!safeName || !allowedDocumentExtensions.has(extension)) return fail("VALIDATION_ERROR", "This file type is not supported.", 400, id);
  const folder = await supabase.from("document_folders").select("id").eq("workspace_id", scoped.access.workspaceId).eq("id", folderId).single();
  if (folder.error) return fail("NOT_FOUND", "Upload folder was not found.", 404, id);
  const bytes = Buffer.from(await file.arrayBuffer());
  const storagePath = `${scoped.access.workspaceId}/${folderId}/${randomUUID()}-${safeName}`;
  const storage = createSupabaseAdminClient().storage.from("workspace-documents");
  const uploaded = await storage.upload(storagePath, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploaded.error) return fail("INTERNAL_ERROR", "File could not be stored.", 500, id);
  const projectId = form.get("projectId") ? String(form.get("projectId")) : null;
  const proposalId = form.get("proposalId") ? String(form.get("proposalId")) : null;
  if ((projectId && !z.string().uuid().safeParse(projectId).success) || (proposalId && !z.string().uuid().safeParse(proposalId).success)) {
    await storage.remove([storagePath]);
    return fail("VALIDATION_ERROR", "projectId and proposalId must be UUIDs.", 400, id);
  }
  const inserted = await supabase.from("documents").insert({ workspace_id: scoped.access.workspaceId, folder_id: folderId, proposal_id: proposalId,
    project_id: projectId, project_name: form.get("projectName") ? String(form.get("projectName")).trim().slice(0, 200) : null,
    name: safeName, storage_path: storagePath, mime_type: file.type || "application/octet-stream", size_bytes: file.size,
    checksum_sha256: createHash("sha256").update(bytes).digest("hex"), uploaded_by: scoped.access.userId })
    .select("id,folder_id,proposal_id,project_id,project_name,name,mime_type,size_bytes,created_at,updated_at").single();
  if (inserted.error) { await storage.remove([storagePath]); return fail("VALIDATION_ERROR", "Document metadata could not be saved.", 400, id); }
  await audit(supabase, "document.uploaded", id);
  return ok(documentDto(inserted.data as Record<string, unknown>), 201, id);
}

async function updateDocument(request: Request, supabase: SupabaseClient, id: string, documentId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, documentPatchSchema, id); if (input.response) return input.response;
  if (input.data.folderId) {
    const folder = await supabase.from("document_folders").select("id").eq("workspace_id", scoped.access.workspaceId).eq("id", input.data.folderId).single();
    if (folder.error) return fail("NOT_FOUND", "Destination folder was not found.", 404, id);
  }
  const values = { ...(input.data.name !== undefined ? { name: input.data.name } : {}), ...(input.data.folderId !== undefined ? { folder_id: input.data.folderId } : {}),
    ...(input.data.projectId !== undefined ? { project_id: input.data.projectId } : {}), ...(input.data.projectName !== undefined ? { project_name: input.data.projectName } : {}) };
  const result = await supabase.from("documents").update(values).eq("workspace_id", scoped.access.workspaceId).eq("id", documentId)
    .select("id,folder_id,proposal_id,project_id,project_name,name,mime_type,size_bytes,created_at,updated_at").single();
  if (result.error) return fail("NOT_FOUND", "Document was not found.", 404, id);
  await audit(supabase, "document.updated", id);
  return ok(documentDto(result.data as Record<string, unknown>), 200, id);
}

async function downloadDocument(supabase: SupabaseClient, id: string, documentId: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const result = await supabase.from("documents").select("name,storage_path").eq("workspace_id", scoped.access.workspaceId).eq("id", documentId).single();
  if (result.error) return fail("NOT_FOUND", "Document was not found.", 404, id);
  const signed = await createSupabaseAdminClient().storage.from("workspace-documents").createSignedUrl(result.data.storage_path, 60, { download: result.data.name });
  return signed.error ? fail("INTERNAL_ERROR", "Download link could not be created.", 500, id) : ok({ url: signed.data.signedUrl, expiresIn: 60, fileName: result.data.name }, 200, id);
}

async function deleteDocument(supabase: SupabaseClient, id: string, documentId: string) {
  const scoped = await workspaceAccess(supabase, id, true, true); if ("response" in scoped) return scoped.response;
  const result = await supabase.from("documents").select("storage_path").eq("workspace_id", scoped.access.workspaceId).eq("id", documentId).single();
  if (result.error) return fail("NOT_FOUND", "Document was not found.", 404, id);
  const removed = await createSupabaseAdminClient().storage.from("workspace-documents").remove([result.data.storage_path]);
  if (removed.error) return fail("INTERNAL_ERROR", "Stored file could not be deleted.", 500, id);
  const deleted = await supabase.from("documents").delete().eq("workspace_id", scoped.access.workspaceId).eq("id", documentId);
  if (deleted.error) return fail("INTERNAL_ERROR", "Document metadata could not be deleted.", 500, id);
  await audit(supabase, "document.deleted", id);
  return ok({ deleted: true }, 200, id);
}

const invoiceSelect = "id,invoice_code,manual_number,document_type,client_id,client_name,billing_address,project_id,project_name,issue_date,due_date,milestone,reference,additional_notes,bank_details,tax_rate,subtotal,tax_amount,total_amount,total_paid,currency,status,sent_at,created_at,updated_at";

function effectiveInvoiceStatus(row: Record<string, unknown>) {
  if (["pending", "sent", "partial"].includes(String(row.status)) && String(row.due_date) < new Date().toISOString().slice(0, 10) && Number(row.total_paid) < Number(row.total_amount)) return "overdue";
  return row.status;
}

function invoiceDto(row: Record<string, unknown>, items?: Record<string, unknown>[], payments?: Record<string, unknown>[]) {
  return {
    id: row.id, invoiceNumber: row.manual_number ?? row.invoice_code, manualNumber: row.manual_number, systemCode: row.invoice_code, type: row.document_type,
    clientId: row.client_id, clientName: row.client_name, billingAddress: row.billing_address,
    projectId: row.project_id, projectName: row.project_name, issueDate: row.issue_date, dueDate: row.due_date,
    milestone: row.milestone, reference: row.reference, additionalNotes: row.additional_notes, bankDetails: row.bank_details, taxRate: Number(row.tax_rate),
    subtotal: Number(row.subtotal), taxAmount: Number(row.tax_amount), totalAmount: Number(row.total_amount),
    totalPaid: Number(row.total_paid), outstanding: Number(row.total_amount) - Number(row.total_paid), currency: row.currency,
    status: effectiveInvoiceStatus(row), storedStatus: row.status, sentAt: row.sent_at, createdAt: row.created_at, updatedAt: row.updated_at,
    ...(items ? { items: items.map((item) => ({ id: item.id, position: item.position, description: item.description, quantity: Number(item.quantity), rate: Number(item.rate), amount: Number(item.amount) })) } : {}),
    ...(payments ? { payments: payments.map((payment) => ({ id: payment.id, amount: Number(payment.amount), paidAt: payment.paid_at, method: payment.method, reference: payment.reference, notes: payment.notes, createdAt: payment.created_at })) } : {}),
  };
}

async function listInvoices(request: NextRequest, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { page, pageSize, from, to } = pagination(request.nextUrl.searchParams);
  const type = request.nextUrl.searchParams.get("type");
  const status = request.nextUrl.searchParams.get("status");
  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 120);
  let query = supabase.from("invoices").select(invoiceSelect, { count: "exact" }).eq("workspace_id", scoped.access.workspaceId)
    .is("archived_at", null).order("updated_at", { ascending: false }).range(from, to);
  if (type && ["invoice","pro_forma","quote"].includes(type)) query = query.eq("document_type", type);
  if (status === "overdue") query = query.in("status", ["pending","sent","partial"]).lt("due_date", new Date().toISOString().slice(0, 10));
  else if (status && ["draft","pending","sent","accepted","partial","paid","void"].includes(status)) query = query.eq("status", status);
  if (search) {
    const safe = search.replace(/[%_,()]/g, " ");
    query = query.or(`invoice_code.ilike.%${safe}%,manual_number.ilike.%${safe}%,project_name.ilike.%${safe}%,client_name.ilike.%${safe}%`);
  }
  const result = await query;
  if (result.error) return fail("INTERNAL_ERROR", "Invoices could not be loaded.", 500, id);
  const total = result.count ?? 0;
  return ok({ items: (result.data ?? []).map((row) => invoiceDto(row as Record<string, unknown>)), page, pageSize, total, hasMore: to + 1 < total }, 200, id);
}

async function invoiceSummary(supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { data, error } = await supabase.from("invoices").select("document_type,status,due_date,total_amount,total_paid")
    .eq("workspace_id", scoped.access.workspaceId).eq("document_type", "invoice").is("archived_at", null).neq("status", "void");
  if (error) return fail("INTERNAL_ERROR", "Invoice summary could not be loaded.", 500, id);
  const today = new Date().toISOString().slice(0, 10);
  const rows = data ?? [];
  const overdue = rows.filter((row) => row.due_date < today && Number(row.total_paid) < Number(row.total_amount) && row.status !== "draft");
  const totalInvoiced = rows.reduce((sum, row) => sum + Number(row.total_amount), 0);
  const collected = rows.reduce((sum, row) => sum + Number(row.total_paid), 0);
  return ok({ totalInvoices: rows.length, totalInvoiced, collected, outstanding: totalInvoiced - collected,
    overdue: overdue.reduce((sum, row) => sum + Number(row.total_amount) - Number(row.total_paid), 0), overdueCount: overdue.length, currency: scoped.access.currency }, 200, id);
}

async function loadInvoice(supabase: SupabaseClient, workspaceId: string, invoiceId: string) {
  const invoice = await supabase.from("invoices").select(invoiceSelect).eq("workspace_id", workspaceId).eq("id", invoiceId).is("archived_at", null).single();
  if (invoice.error) return null;
  const [items, payments] = await Promise.all([
    supabase.from("invoice_items").select("id,position,description,quantity,rate,amount").eq("workspace_id", workspaceId).eq("invoice_id", invoiceId).order("position"),
    supabase.from("invoice_payments").select("id,amount,paid_at,method,reference,notes,created_at").eq("workspace_id", workspaceId).eq("invoice_id", invoiceId).order("paid_at", { ascending: false }),
  ]);
  if (items.error || payments.error) return null;
  return invoiceDto(invoice.data as Record<string, unknown>, (items.data ?? []) as Record<string, unknown>[], (payments.data ?? []) as Record<string, unknown>[]);
}

async function getInvoice(supabase: SupabaseClient, id: string, invoiceId: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const invoice = await loadInvoice(supabase, scoped.access.workspaceId, invoiceId);
  return invoice ? ok(invoice, 200, id) : fail("NOT_FOUND", "Invoice was not found.", 404, id);
}

async function createInvoice(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, invoiceCreateSchema, id); if (input.response) return input.response;
  const saved = await supabase.rpc("save_invoice", { p_invoice: input.data, p_items: input.data.items, p_invoice_id: null });
  if (saved.error || !saved.data) return fail(saved.error?.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR", saved.error?.code === "23505" ? "Invoice number already exists." : "Invoice could not be created.", saved.error?.code === "23505" ? 409 : 400, id);
  const invoice = await loadInvoice(supabase, scoped.access.workspaceId, String(saved.data));
  if (!invoice) return fail("INTERNAL_ERROR", "Invoice was created but could not be reloaded.", 500, id);
  await audit(supabase, "invoice.created", id);
  return ok(invoice, 201, id);
}

async function updateInvoice(request: Request, supabase: SupabaseClient, id: string, invoiceId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, invoicePatchSchema, id); if (input.response) return input.response;
  const current = await loadInvoice(supabase, scoped.access.workspaceId, invoiceId);
  if (!current) return fail("NOT_FOUND", "Invoice was not found.", 404, id);
  if (["paid","void"].includes(String(current.storedStatus))) return fail("CONFLICT", "Paid or void invoices cannot be edited.", 409, id);
  const patch = input.data;
  const merged = {
    type: patch.type ?? current.type, clientId: patch.clientId !== undefined ? patch.clientId : current.clientId,
    clientName: patch.clientName ?? current.clientName, billingAddress: patch.billingAddress ?? current.billingAddress,
    projectId: patch.projectId !== undefined ? patch.projectId : current.projectId, projectName: patch.projectName ?? current.projectName,
    invoiceNumber: patch.invoiceNumber !== undefined ? patch.invoiceNumber : current.manualNumber ?? undefined,
    issueDate: patch.issueDate ?? current.issueDate, dueDate: patch.dueDate ?? current.dueDate, milestone: patch.milestone ?? current.milestone,
    reference: patch.reference !== undefined ? patch.reference : current.reference, taxRate: patch.taxRate ?? current.taxRate,
    additionalNotes: patch.additionalNotes !== undefined ? patch.additionalNotes : current.additionalNotes,
    bankDetails: patch.bankDetails !== undefined ? patch.bankDetails : current.bankDetails,
    status: patch.status ?? current.storedStatus, items: patch.items ?? current.items,
  };
  if (String(merged.dueDate) < String(merged.issueDate)) return fail("VALIDATION_ERROR", "Due date cannot be before issue date.", 400, id, { dueDate: ["Due date cannot be before issue date."] });
  const saved = await supabase.rpc("save_invoice", { p_invoice: merged, p_items: merged.items, p_invoice_id: invoiceId });
  if (saved.error) return fail(saved.error.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR", saved.error.code === "23505" ? "Invoice number already exists." : "Invoice could not be updated.", saved.error.code === "23505" ? 409 : 400, id);
  const invoice = await loadInvoice(supabase, scoped.access.workspaceId, invoiceId);
  await audit(supabase, "invoice.updated", id);
  return invoice ? ok(invoice, 200, id) : fail("INTERNAL_ERROR", "Invoice could not be reloaded.", 500, id);
}

async function changeInvoiceStatus(request: Request, supabase: SupabaseClient, id: string, invoiceId: string) {
  const preliminary = await parsed(request, invoiceStatusSchema, id); if (preliminary.response) return preliminary.response;
  const scoped = await workspaceAccess(supabase, id, true, preliminary.data.status === "void"); if ("response" in scoped) return scoped.response;
  const changed = await supabase.rpc("set_invoice_status", { p_invoice_id: invoiceId, p_status: preliminary.data.status });
  if (changed.error) return fail("CONFLICT", "Invoice status could not be changed.", 409, id);
  await audit(supabase, `invoice.${preliminary.data.status}`, id);
  const invoice = await loadInvoice(supabase, scoped.access.workspaceId, invoiceId);
  return invoice ? ok(invoice, 200, id) : fail("INTERNAL_ERROR", "Invoice could not be reloaded.", 500, id);
}

async function recordInvoicePayment(request: Request, supabase: SupabaseClient, id: string, invoiceId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, paymentCreateSchema, id); if (input.response) return input.response;
  const paid = await supabase.rpc("record_invoice_payment", { p_invoice_id: invoiceId, p_payment: input.data });
  if (paid.error) return fail("VALIDATION_ERROR", "Payment could not be recorded. Check the invoice type and outstanding balance.", 400, id);
  await audit(supabase, "invoice.payment.recorded", id);
  const invoice = await loadInvoice(supabase, scoped.access.workspaceId, invoiceId);
  return invoice ? ok(invoice, 201, id) : fail("INTERNAL_ERROR", "Payment was recorded but the invoice could not be reloaded.", 500, id);
}

async function archiveInvoice(supabase: SupabaseClient, id: string, invoiceId: string) {
  const scoped = await workspaceAccess(supabase, id, true, true); if ("response" in scoped) return scoped.response;
  const result = await supabase.rpc("archive_invoice", { p_invoice_id: invoiceId });
  if (result.error) return fail("CONFLICT", "Invoice could not be archived. Invoices with payments must be voided instead.", 409, id);
  await audit(supabase, "invoice.archived", id);
  return ok({ archived: true }, 200, id);
}

function basicInvoicePdf(invoice: Awaited<ReturnType<typeof loadInvoice>> & Record<string, unknown>) {
  const address = invoice.billingAddress as { line1?: string; line2?: string; city?: string; state?: string; pincode?: string } | null;
  const bank = invoice.bankDetails as { bankName?: string; accountHolder?: string; accountNumber?: string; ifscCode?: string } | null;
  const itemLines = ((invoice.items as Array<{ description: string; quantity: number; rate: number; amount: number }>) ?? []).slice(0, 16)
    .map((item) => `${item.description} | ${item.quantity} x ${item.rate.toFixed(2)} | ${item.amount.toFixed(2)}`);
  const lines = [
    `${invoice.invoiceNumber} - ${String(invoice.type).replace("_", " ").toUpperCase()}`,
    `Billed to: ${invoice.clientName}`,
    `Address: ${[address?.line1,address?.line2,address?.city,address?.state,address?.pincode].filter(Boolean).join(", ")}`,
    `Project: ${invoice.projectName}`, `Issue date: ${invoice.issueDate}`, `Due date: ${invoice.dueDate}`, `Milestone: ${invoice.milestone}`, "",
    "Description | Qty x Rate | Amount", ...itemLines, "", `Subtotal: ${invoice.currency} ${Number(invoice.subtotal).toFixed(2)}`,
    `Tax (${invoice.taxRate}%): ${invoice.currency} ${Number(invoice.taxAmount).toFixed(2)}`, `Total: ${invoice.currency} ${Number(invoice.totalAmount).toFixed(2)}`,
    `Paid: ${invoice.currency} ${Number(invoice.totalPaid).toFixed(2)}`, `Outstanding: ${invoice.currency} ${Number(invoice.outstanding).toFixed(2)}`,
    ...(bank ? ["", `Bank: ${bank.bankName ?? ""}`, `Account holder: ${bank.accountHolder ?? ""}`, `Account: ${bank.accountNumber ?? ""}`, `IFSC: ${bank.ifscCode ?? ""}`] : []),
  ];
  const commands = lines.map((line, index) => `BT /F1 ${index === 0 ? 17 : 10} Tf 40 ${770 - index * 22} Td (${pdfEscape(line).slice(0, 115)}) Tj ET`).join("\n");
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${Buffer.byteLength(commands, "ascii")} >>\nstream\n${commands}\nendstream`];
  let output = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(output, "ascii")); output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(output, "ascii");
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Uint8Array(Buffer.from(output, "ascii"));
}

async function invoicePdf(supabase: SupabaseClient, id: string, invoiceId: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const invoice = await loadInvoice(supabase, scoped.access.workspaceId, invoiceId);
  if (!invoice) return fail("NOT_FOUND", "Invoice was not found.", 404, id);
  return new Response(basicInvoicePdf(invoice as typeof invoice & Record<string, unknown>), { status: 200, headers: {
    "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=\"${pdfEscape(invoice.invoiceNumber)}.pdf\"`,
    "Cache-Control": "private, no-store", "X-Request-Id": id,
  } });
}

async function dispatch(request: NextRequest, path: string[]) {
  const id = requestId(request);
  const route = path.join("/");
  let supabase: SupabaseClient;
  try { supabase = await createSupabaseServerClient(); }
  catch { return fail("INTERNAL_ERROR", "Backend is not configured.", 500, id); }

  if (request.method === "POST" && route === "auth/register") return register(request, supabase, id);
  if (request.method === "POST" && route === "auth/login") return login(request, supabase, id);
  if (request.method === "POST" && route === "auth/refresh") return refresh(supabase, id);
  if (request.method === "POST" && route === "auth/logout") return logout(supabase, id);
  if (request.method === "GET" && route === "auth/me") return getMe(supabase, id);
  if (request.method === "POST" && route === "auth/forgot-password") return forgotPassword(request, supabase, id);
  if (request.method === "POST" && route === "auth/reset-password") return resetPassword(request, supabase, id);
  if ((request.method === "GET" || request.method === "POST") && route === "auth/verify-email") return verifyEmail(request, supabase, id);
  if (request.method === "POST" && route === "auth/resend-verification") return resendVerification(request, supabase, id);
  if (request.method === "GET" && route === "users/me") return getMe(supabase, id);
  if (request.method === "PATCH" && route === "users/me") return patchUser(request, supabase, id);
  if (request.method === "PATCH" && route === "users/me/password") return changePassword(request, supabase, id);
  if ((request.method === "GET" || request.method === "PATCH") && route === "users/me/preferences") return preferences(request, supabase, id);
  if ((request.method === "GET" || request.method === "PATCH") && route === "onboarding/me") return onboarding(request, supabase, id);
  if (request.method === "GET" && route === "dashboard/overview") return dashboardOverview(request, supabase, id);
  const list = route.match(/^dashboard\/(recent-projects|recent-boqs|pending-actions|upcoming-deliverables|notifications)$/)?.[1];
  if (request.method === "GET" && list) return dashboardList(request, supabase, id, list);
  if (request.method === "GET" && route === "proposals") return listProposals(request, supabase, id);
  if (request.method === "GET" && route === "proposals/summary") return proposalSummary(supabase, id);
  if (request.method === "POST" && route === "proposals") return createProposal(request, supabase, id);
  const proposalMatch = route.match(/^proposals\/([0-9a-f-]{36})$/i);
  if (proposalMatch && request.method === "GET") return getProposal(supabase, id, proposalMatch[1]);
  if (proposalMatch && request.method === "PATCH") return updateProposal(request, supabase, id, proposalMatch[1]);
  if (proposalMatch && request.method === "DELETE") return archiveProposal(supabase, id, proposalMatch[1]);
  const proposalStatusMatch = route.match(/^proposals\/([0-9a-f-]{36})\/status$/i);
  if (proposalStatusMatch && request.method === "POST") return changeProposalStatus(request, supabase, id, proposalStatusMatch[1]);
  const proposalPdfMatch = route.match(/^proposals\/([0-9a-f-]{36})\/pdf$/i);
  if (proposalPdfMatch && request.method === "GET") return proposalPdf(supabase, id, proposalPdfMatch[1]);
  const proposalViewMatch = route.match(/^proposals\/([0-9a-f-]{36})\/view$/i);
  if (proposalViewMatch && request.method === "POST") return recordProposalView(supabase, id, proposalViewMatch[1]);
  if (request.method === "GET" && route === "document-folders") return listFolders(request, supabase, id);
  if (request.method === "POST" && route === "document-folders") return createFolder(request, supabase, id);
  const folderMatch = route.match(/^document-folders\/([0-9a-f-]{36})$/i);
  if (folderMatch && request.method === "PATCH") return updateFolder(request, supabase, id, folderMatch[1]);
  if (folderMatch && request.method === "DELETE") return deleteFolder(request, supabase, id, folderMatch[1]);
  if (request.method === "GET" && route === "documents") return listDocuments(request, supabase, id);
  if (request.method === "POST" && route === "documents/upload") return uploadDocument(request, supabase, id);
  const documentMatch = route.match(/^documents\/([0-9a-f-]{36})$/i);
  if (documentMatch && request.method === "PATCH") return updateDocument(request, supabase, id, documentMatch[1]);
  if (documentMatch && request.method === "DELETE") return deleteDocument(supabase, id, documentMatch[1]);
  const downloadMatch = route.match(/^documents\/([0-9a-f-]{36})\/download$/i);
  if (downloadMatch && request.method === "GET") return downloadDocument(supabase, id, downloadMatch[1]);
  if (request.method === "GET" && route === "invoices") return listInvoices(request, supabase, id);
  if (request.method === "GET" && route === "invoices/summary") return invoiceSummary(supabase, id);
  if (request.method === "POST" && route === "invoices") return createInvoice(request, supabase, id);
  const invoiceMatch = route.match(/^invoices\/([0-9a-f-]{36})$/i);
  if (invoiceMatch && request.method === "GET") return getInvoice(supabase, id, invoiceMatch[1]);
  if (invoiceMatch && request.method === "PATCH") return updateInvoice(request, supabase, id, invoiceMatch[1]);
  if (invoiceMatch && request.method === "DELETE") return archiveInvoice(supabase, id, invoiceMatch[1]);
  const invoiceStatusMatch = route.match(/^invoices\/([0-9a-f-]{36})\/status$/i);
  if (invoiceStatusMatch && request.method === "POST") return changeInvoiceStatus(request, supabase, id, invoiceStatusMatch[1]);
  const invoicePaymentMatch = route.match(/^invoices\/([0-9a-f-]{36})\/payments$/i);
  if (invoicePaymentMatch && request.method === "POST") return recordInvoicePayment(request, supabase, id, invoicePaymentMatch[1]);
  const invoicePdfMatch = route.match(/^invoices\/([0-9a-f-]{36})\/pdf$/i);
  if (invoicePdfMatch && request.method === "GET") return invoicePdf(supabase, id, invoicePdfMatch[1]);
  return methodNotAllowed(id);
}

export async function GET(request: NextRequest, params: Params) { return dispatch(request, (await params.params).path); }
export async function POST(request: NextRequest, params: Params) { return dispatch(request, (await params.params).path); }
export async function PATCH(request: NextRequest, params: Params) { return dispatch(request, (await params.params).path); }
export async function DELETE(request: NextRequest, params: Params) { return dispatch(request, (await params.params).path); }
