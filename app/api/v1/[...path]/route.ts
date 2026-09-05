import { type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import * as XLSX from "xlsx";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EmailOtpError, issueEmailOtp, verifyEmailOtp } from "@/lib/auth/email-otp";
import { isEmailOtpBypassed } from "@/lib/auth/otp-bypass";
import { pagination } from "@/lib/domain/dashboard";
import { demoPendingActions, demoRecentBoqs, demoRecentProjects, demoUpcomingDeliverables } from "@/lib/domain/dashboard-demo";
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

  // my changes
  projectCreateSchema,
  projectPatchSchema,
  projectRoomCreateSchema,
  projectRoomPatchSchema,
  projectStatusSchema,
  boqImportSchema,

  // Friend's changes
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
  boqCreateSchema,
  boqPatchSchema,
  boqStatusSchema,
  boqRoomSchema,
  boqCategorySchema,
  boqItemSchema,
  boqTemplateSchema,
  costingCategorySchema,
  costingCategoryPatchSchema,
  costingItemSchema,
  costingItemPatchSchema,
  vendorQuoteSchema,
  vendorSelectionSchema,
  costingScenarioSchema,
  costingScenarioPatchSchema,
  projectTemplateCreateSchema,
  projectTemplatePatchSchema,
  projectTemplateSectionSchema,
  projectTemplateDocumentsSchema,
  projectTemplateUseSchema,
  projectTemplatePublishSchema,
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
  if (!("otp" in input.data) && !isEmailOtpBypassed(input.data.email)) {
    try { await issueEmailOtp(input.data.email, data.user.id); }
    catch (otpError) { return emailOtpFailure(otpError, id); }
    await supabase.auth.signOut({ scope: "local" });
    return ok({ otpRequired: true, otpSent: true, message: "A 6-digit login code has been sent through Gmail." }, 200, id);
  }
  const ctx = await context(supabase, id); if ("response" in ctx) return ctx.response;
  await audit(supabase, "auth.login.succeeded", id);
  return ok({ otpRequired: false, user: { id: data.user.id, email: data.user.email }, context: ctx.data }, 200, id);
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

    // Registration uses an admin-created user, so confirming the email alone does
    // not create a session in this browser. Mint a one-time magic-link token and
    // consume it through the SSR client to persist the auth cookies.
    const link = await admin.auth.admin.generateLink({ type: "magiclink", email: otpInput.data.email });
    const tokenHash = link.data?.properties?.hashed_token;
    if (link.error || !tokenHash) return fail("INTERNAL_ERROR", "A session could not be created after verification.", 500, id);
    const session = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
    if (session.error || !session.data.user) return fail("INTERNAL_ERROR", "A session could not be created after verification.", 500, id);
    await audit(supabase, "auth.email.verified", id);
    return ok({ verified: true, user: { id: session.data.user.id, email: session.data.user.email } }, 200, id);
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
  // TODO(PROJECT_BOQ_BACKEND): Keep this endpoint aligned with real domain aggregates.
  return ok(base, 200, id);
}

const projectSelect = "id,project_code,name,client_name,client_contact,client_email,project_type,status,location,description,area_sqft,project_value,approved_budget,start_date,target_completion_date,assigned_designer_id,tags,progress,created_by,created_at,updated_at";

function projectDto(row: Record<string, unknown>) {
  return {
    id: row.id, projectCode: row.project_code, name: row.name, clientName: row.client_name,
    clientContact: row.client_contact, clientEmail: row.client_email, projectType: row.project_type,
    status: row.status, location: row.location, description: row.description,
    areaSqft: row.area_sqft == null ? null : Number(row.area_sqft),
    projectValue: row.project_value == null ? null : Number(row.project_value),
    approvedBudget: row.approved_budget == null ? null : Number(row.approved_budget),
    startDate: row.start_date, targetCompletionDate: row.target_completion_date,
    assignedDesignerId: row.assigned_designer_id, tags: row.tags ?? [], progress: Number(row.progress ?? 0),
    createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function projectValues(input: Record<string, unknown>) {
  const fieldMap: Record<string, string> = {
    name: "name", clientName: "client_name", clientContact: "client_contact", clientEmail: "client_email",
    projectType: "project_type", status: "status", location: "location", description: "description",
    areaSqft: "area_sqft", projectValue: "project_value", approvedBudget: "approved_budget",
    startDate: "start_date", targetCompletionDate: "target_completion_date",
    assignedDesignerId: "assigned_designer_id", tags: "tags",
  };
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [fieldMap[key], value === "" ? null : value]).filter(([key]) => key));
}

async function listProjects(request: NextRequest, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { page, pageSize, from, to } = pagination(request.nextUrl.searchParams);
  const status = request.nextUrl.searchParams.get("status");
  const type = request.nextUrl.searchParams.get("type")?.trim().slice(0, 80);
  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 120);
  let query = supabase.from("projects").select(projectSelect, { count: "exact" })
    .eq("workspace_id", scoped.access.workspaceId).is("archived_at", null)
    .order("updated_at", { ascending: false }).range(from, to);
  if (status && ["active","planning","in_progress","on_hold","completed"].includes(status)) query = query.eq("status", status);
  if (type) query = query.eq("project_type", type);
  if (request.nextUrl.searchParams.get("assignedToMe") === "true") query = query.eq("assigned_designer_id", scoped.access.userId);
  if (search) {
    const safe = search.replace(/[%_,()]/g, " ");
    query = query.or(`project_code.ilike.%${safe}%,name.ilike.%${safe}%,client_name.ilike.%${safe}%,location.ilike.%${safe}%`);
  }
  const result = await query;
  if (result.error) return fail("INTERNAL_ERROR", "Projects could not be loaded.", 500, id);
  const total = result.count ?? 0;
  return ok({ items: (result.data ?? []).map((row) => projectDto(row as Record<string, unknown>)), page, pageSize, total, hasMore: to + 1 < total }, 200, id);
}

async function createProject(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, projectCreateSchema, id); if (input.response) return input.response;
  const { data, error } = await supabase.from("projects").insert({
    workspace_id: scoped.access.workspaceId, created_by: scoped.access.userId, ...projectValues(input.data),
  }).select(projectSelect).single();
  if (error) {
    console.error(JSON.stringify({ requestId: id, event: "project_create_failed", code: error.code, message: error.message }));
    return fail(error.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR", error.code === "23505" ? "A project with these details already exists." : "Project could not be created.", error.code === "23505" ? 409 : 400, id);
  }
  await audit(supabase, "project.created", id);
  return ok(projectDto(data as Record<string, unknown>), 201, id);
}

async function getProject(supabase: SupabaseClient, id: string, projectId: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const [project, rooms] = await Promise.all([
    supabase.from("projects").select(projectSelect).eq("workspace_id", scoped.access.workspaceId).eq("id", projectId).is("archived_at", null).maybeSingle(),
    supabase.from("project_rooms").select("id,name,room_type,length,width,height,unit,notes,sort_order,created_at,updated_at").eq("workspace_id", scoped.access.workspaceId).eq("project_id", projectId).order("sort_order"),
  ]);
  if (project.error || rooms.error) return fail("INTERNAL_ERROR", "Project could not be loaded.", 500, id);
  if (!project.data) return fail("NOT_FOUND", "Project was not found.", 404, id);
  return ok({ ...projectDto(project.data as Record<string, unknown>), rooms: rooms.data ?? [] }, 200, id);
}

async function updateProject(request: Request, supabase: SupabaseClient, id: string, projectId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, projectPatchSchema, id); if (input.response) return input.response;
  const { data, error } = await supabase.from("projects").update(projectValues(input.data))
    .eq("workspace_id", scoped.access.workspaceId).eq("id", projectId).is("archived_at", null).select(projectSelect).maybeSingle();
  if (error) return fail("VALIDATION_ERROR", "Project could not be updated.", 400, id);
  if (!data) return fail("NOT_FOUND", "Project was not found.", 404, id);
  await audit(supabase, "project.updated", id);
  return ok(projectDto(data as Record<string, unknown>), 200, id);
}

async function changeProjectStatus(request: Request, supabase: SupabaseClient, id: string, projectId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, projectStatusSchema, id); if (input.response) return input.response;
  const progress = input.data.status === "completed" ? 100 : undefined;
  const { data, error } = await supabase.from("projects").update({ status: input.data.status, ...(progress == null ? {} : { progress }) })
    .eq("workspace_id", scoped.access.workspaceId).eq("id", projectId).is("archived_at", null).select(projectSelect).maybeSingle();
  if (error) return fail("VALIDATION_ERROR", "Project status could not be changed.", 400, id);
  if (!data) return fail("NOT_FOUND", "Project was not found.", 404, id);
  await audit(supabase, `project.status.${input.data.status}`, id);
  return ok(projectDto(data as Record<string, unknown>), 200, id);
}

async function duplicateProject(supabase: SupabaseClient, id: string, projectId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const source = await supabase.from("projects").select(projectSelect).eq("workspace_id", scoped.access.workspaceId).eq("id", projectId).is("archived_at", null).maybeSingle();
  if (source.error) return fail("INTERNAL_ERROR", "Project could not be duplicated.", 500, id);
  if (!source.data) return fail("NOT_FOUND", "Project was not found.", 404, id);
  const row = source.data as Record<string, unknown>;
  const created = await supabase.from("projects").insert({
    workspace_id: scoped.access.workspaceId, created_by: scoped.access.userId, name: `${row.name} (Copy)`,
    client_name: row.client_name, client_contact: row.client_contact, client_email: row.client_email,
    project_type: row.project_type, status: "planning", location: row.location, description: row.description,
    area_sqft: row.area_sqft, project_value: row.project_value, approved_budget: row.approved_budget,
    start_date: row.start_date, target_completion_date: row.target_completion_date,
    assigned_designer_id: row.assigned_designer_id, tags: row.tags,
  }).select(projectSelect).single();
  if (created.error) return fail("VALIDATION_ERROR", "Project could not be duplicated.", 400, id);
  const sourceRooms = await supabase.from("project_rooms").select("name,room_type,length,width,height,unit,notes,sort_order").eq("project_id", projectId).eq("workspace_id", scoped.access.workspaceId);
  if (!sourceRooms.error && sourceRooms.data?.length) await supabase.from("project_rooms").insert(sourceRooms.data.map((room) => ({ ...room, workspace_id: scoped.access.workspaceId, project_id: created.data.id, created_by: scoped.access.userId })));
  await audit(supabase, "project.duplicated", id);
  return ok(projectDto(created.data as Record<string, unknown>), 201, id);
}

async function deleteProject(supabase: SupabaseClient, id: string, projectId: string) {
  const scoped = await workspaceAccess(supabase, id, false, true); if ("response" in scoped) return scoped.response;
  const { data, error } = await supabase.from("projects").delete().eq("workspace_id", scoped.access.workspaceId).eq("id", projectId).select("id").maybeSingle();
  if (error) return fail("VALIDATION_ERROR", "Project could not be deleted because it has dependent records.", 400, id);
  if (!data) return fail("NOT_FOUND", "Project was not found.", 404, id);
  await audit(supabase, "project.deleted", id);
  return ok({ deleted: true, id: projectId }, 200, id);
}

async function listProjectRooms(supabase: SupabaseClient, id: string, projectId: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const result = await supabase.from("project_rooms").select("id,name,room_type,length,width,height,unit,notes,sort_order,created_at,updated_at")
    .eq("workspace_id", scoped.access.workspaceId).eq("project_id", projectId).order("sort_order").order("created_at");
  return result.error ? fail("INTERNAL_ERROR", "Rooms could not be loaded.", 500, id) : ok({ items: result.data ?? [] }, 200, id);
}

async function createProjectRoom(request: Request, supabase: SupabaseClient, id: string, projectId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, projectRoomCreateSchema, id); if (input.response) return input.response;
  const project = await supabase.from("projects").select("id").eq("workspace_id", scoped.access.workspaceId).eq("id", projectId).is("archived_at", null).maybeSingle();
  if (!project.data) return fail("NOT_FOUND", "Project was not found.", 404, id);
  const value = input.data;
  const result = await supabase.from("project_rooms").insert({ workspace_id: scoped.access.workspaceId, project_id: projectId, created_by: scoped.access.userId,
    name: value.name, room_type: value.roomType, length: value.length, width: value.width, height: value.height, unit: value.unit, notes: value.notes })
    .select("id,name,room_type,length,width,height,unit,notes,sort_order,created_at,updated_at").single();
  if (result.error) return fail(result.error.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR", result.error.code === "23505" ? "A room with this name already exists." : "Room could not be created.", result.error.code === "23505" ? 409 : 400, id);
  return ok(result.data, 201, id);
}

async function updateProjectRoom(request: Request, supabase: SupabaseClient, id: string, projectId: string, roomId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, projectRoomPatchSchema, id); if (input.response) return input.response;
  const map: Record<string, string> = { name: "name", roomType: "room_type", length: "length", width: "width", height: "height", unit: "unit", notes: "notes" };
  const values = Object.fromEntries(Object.entries(input.data).map(([key, value]) => [map[key], value]).filter(([key]) => key));
  const result = await supabase.from("project_rooms").update(values).eq("workspace_id", scoped.access.workspaceId).eq("project_id", projectId).eq("id", roomId)
    .select("id,name,room_type,length,width,height,unit,notes,sort_order,created_at,updated_at").maybeSingle();
  if (result.error) return fail("VALIDATION_ERROR", "Room could not be updated.", 400, id);
  return result.data ? ok(result.data, 200, id) : fail("NOT_FOUND", "Room was not found.", 404, id);
}

async function deleteProjectRoom(supabase: SupabaseClient, id: string, projectId: string, roomId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const result = await supabase.from("project_rooms").delete().eq("workspace_id", scoped.access.workspaceId).eq("project_id", projectId).eq("id", roomId).select("id").maybeSingle();
  if (result.error) return fail("VALIDATION_ERROR", "Room could not be deleted.", 400, id);
  return result.data ? ok({ deleted: true, id: roomId }, 200, id) : fail("NOT_FOUND", "Room was not found.", 404, id);
}

const projectImportHeaders: Record<string, string> = {
  projectname: "name", name: "name", project: "name",
  clientname: "clientName", client: "clientName",
  projecttype: "projectType", type: "projectType",
  status: "status", location: "location", address: "location",
  clientcontact: "clientContact", contact: "clientContact", phone: "clientContact",
  clientemail: "clientEmail", email: "clientEmail",
  description: "description", scope: "description",
  areasqft: "areaSqft", area: "areaSqft", squarefeet: "areaSqft", squarefoot: "areaSqft",
  projectvalue: "projectValue", value: "projectValue",
  approvedbudget: "approvedBudget", budget: "approvedBudget",
  startdate: "startDate", targetcompletiondate: "targetCompletionDate", completiondate: "targetCompletionDate", duedate: "targetCompletionDate",
  tags: "tags",
};

function importKey(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]/g, ""); }

function importNumber(value: unknown) {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/[₹,$\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : value;
}

function importDate(value: unknown) {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[-/]([A-Za-z]{3}|\d{1,2})[-/](\d{4})$/);
  if (match) {
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const month = /^\d+$/.test(match[2]) ? Number(match[2]) : months.indexOf(match[2].toLowerCase()) + 1;
    if (month > 0 && month < 13) return `${match[3]}-${String(month).padStart(2, "0")}-${String(Number(match[1])).padStart(2, "0")}`;
  }
  return text;
}

type ParsedProjectImport = { rowNumber: number; data: z.infer<typeof projectCreateSchema> | null; errors: Record<string, string[]> };

async function parseProjectWorkbook(request: Request, id: string) {
  let form: FormData;
  try { form = await request.formData(); } catch { return { response: fail("VALIDATION_ERROR", "A multipart form with a file is required.", 400, id) }; }
  const upload = form.get("file");
  if (!(upload instanceof File)) return { response: fail("VALIDATION_ERROR", "The file field is required.", 400, id, { file: ["Choose a CSV, XLS, or XLSX file."] }) };
  const extension = upload.name.split(".").pop()?.toLowerCase();
  if (!extension || !["csv", "xls", "xlsx"].includes(extension)) return { response: fail("VALIDATION_ERROR", "Unsupported spreadsheet type.", 400, id, { file: ["Only .csv, .xls, and .xlsx files are accepted."] }) };
  if (upload.size > 10 * 1024 * 1024) return { response: fail("PAYLOAD_TOO_LARGE", "Spreadsheet files are limited to 10 MB.", 413, id) };
  let workbook: XLSX.WorkBook;
  try { workbook = XLSX.read(Buffer.from(await upload.arrayBuffer()), { type: "buffer", cellDates: true }); }
  catch { return { response: fail("VALIDATION_ERROR", "The spreadsheet could not be read.", 400, id, { file: ["The file may be corrupted or password protected."] }) }; }
  const sheetName = String(form.get("sheet") ?? workbook.SheetNames[0] ?? "");
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { response: fail("VALIDATION_ERROR", "The requested worksheet was not found.", 400, id, { sheet: [`Available sheets: ${workbook.SheetNames.join(", ")}`] }) };
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true });
  if (rawRows.length > 5000) return { response: fail("PAYLOAD_TOO_LARGE", "A project import is limited to 5,000 data rows.", 413, id) };
  const rows: ParsedProjectImport[] = rawRows.map((raw, index) => {
    const mapped: Record<string, unknown> = {};
    for (const [header, value] of Object.entries(raw)) {
      const target = projectImportHeaders[importKey(header)];
      if (target) mapped[target] = value;
    }
    for (const key of ["name","clientName","projectType","location","clientContact","clientEmail","description"]) if (mapped[key] != null) mapped[key] = String(mapped[key]).trim();
    mapped.status = String(mapped.status ?? "planning").trim().toLowerCase().replace(/[ -]+/g, "_");
    for (const key of ["areaSqft","projectValue","approvedBudget"]) mapped[key] = importNumber(mapped[key]);
    for (const key of ["startDate","targetCompletionDate"]) mapped[key] = importDate(mapped[key]);
    if (mapped.tags != null) mapped.tags = String(mapped.tags).split(",").map((tag) => tag.trim()).filter(Boolean);
    const result = projectCreateSchema.safeParse(mapped);
    return result.success
      ? { rowNumber: index + 2, data: result.data, errors: {} }
      : { rowNumber: index + 2, data: null, errors: fieldErrors(result.error) };
  });
  return { file: upload, extension: extension as "csv" | "xls" | "xlsx", workbook, sheetName, rows };
}

async function previewProjectImport(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const parsedFile = await parseProjectWorkbook(request, id); if ("response" in parsedFile) return parsedFile.response;
  const invalidRows = parsedFile.rows.filter((row) => !row.data);
  return ok({ fileName: parsedFile.file.name, fileType: parsedFile.extension, sheets: parsedFile.workbook.SheetNames,
    selectedSheet: parsedFile.sheetName, totalRows: parsedFile.rows.length, validRows: parsedFile.rows.length - invalidRows.length,
    invalidRows: invalidRows.length, rows: parsedFile.rows.slice(0, 100) }, 200, id);
}

async function importProjects(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const parsedFile = await parseProjectWorkbook(request, id); if ("response" in parsedFile) return parsedFile.response;
  const invalidRows = parsedFile.rows.filter((row) => !row.data);
  const skipInvalid = new URL(request.url).searchParams.get("skipInvalid") === "true";
  if (invalidRows.length && !skipInvalid) {
    return fail("IMPORT_VALIDATION_FAILED", `The spreadsheet contains ${invalidRows.length} invalid row(s). Preview the file or use skipInvalid=true.`, 422, id,
      Object.fromEntries(invalidRows.slice(0, 100).map((row) => [`rows.${row.rowNumber}`, Object.entries(row.errors).flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))])));
  }
  const valid = parsedFile.rows.filter((row): row is ParsedProjectImport & { data: z.infer<typeof projectCreateSchema> } => row.data !== null);
  if (!valid.length) return fail("IMPORT_VALIDATION_FAILED", "The spreadsheet contains no valid project rows.", 422, id);
  const result = await supabase.from("projects").insert(valid.map((row) => ({ workspace_id: scoped.access.workspaceId, created_by: scoped.access.userId, ...projectValues(row.data) }))).select(projectSelect);
  if (result.error) {
    console.error(JSON.stringify({ requestId: id, event: "project_import_failed", code: result.error.code, message: result.error.message }));
    return fail("IMPORT_FAILED", "No projects were imported. Check duplicates and field values.", 400, id);
  }
  const log = await supabase.from("project_imports").insert({ workspace_id: scoped.access.workspaceId, created_by: scoped.access.userId,
    file_name: parsedFile.file.name, file_type: parsedFile.extension, total_rows: parsedFile.rows.length,
    imported_rows: result.data?.length ?? 0, skipped_rows: invalidRows.length, errors: invalidRows }).select("id").single();
  await audit(supabase, "project.excel_imported", id);
  return ok({ importId: log.data?.id ?? null, fileName: parsedFile.file.name, totalRows: parsedFile.rows.length,
    importedRows: result.data?.length ?? 0, skippedRows: invalidRows.length,
    projects: (result.data ?? []).map((row) => projectDto(row as Record<string, unknown>)), errors: invalidRows }, 201, id);
}

async function projectImportHistory(request: NextRequest, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { page, pageSize, from, to } = pagination(request.nextUrl.searchParams);
  const result = await supabase.from("project_imports").select("id,file_name,file_type,total_rows,imported_rows,skipped_rows,status,errors,created_at", { count: "exact" })
    .eq("workspace_id", scoped.access.workspaceId).order("created_at", { ascending: false }).range(from, to);
  if (result.error) return fail("INTERNAL_ERROR", "Import history could not be loaded.", 500, id);
  const total = result.count ?? 0;
  return ok({ items: result.data ?? [], page, pageSize, total, hasMore: to + 1 < total }, 200, id);
}

async function projectImportTemplate(supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const sheet = XLSX.utils.json_to_sheet([{ ProjectName: "Oberoi Residence", ClientName: "Nikhil Oberoi", ProjectType: "Residential",
    Status: "planning", Location: "Bandra West, Mumbai", ClientContact: "+91 98765 43210", ClientEmail: "client@example.com",
    AreaSqft: 3200, ProjectValue: 4800000, ApprovedBudget: 4250000, StartDate: "2026-09-15", TargetCompletionDate: "2026-12-15", Tags: "Luxury, Turnkey", Description: "Residential interior project" }]);
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, "Projects");
  const output = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new Response(new Uint8Array(output), { status: 200, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": "attachment; filename=project-import-template.xlsx", "Cache-Control": "private, no-store", "X-Request-Id": id } });
}

async function projectExport(supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const result = await supabase.from("projects").select(projectSelect)
    .eq("workspace_id", scoped.access.workspaceId).is("archived_at", null).order("updated_at", { ascending: false });
  if (result.error) return fail("INTERNAL_ERROR", "Projects could not be exported.", 500, id);
  const rows = (result.data ?? []).map((row) => {
    const project = projectDto(row as Record<string, unknown>);
    return { ProjectCode: project.projectCode, ProjectName: project.name, ClientName: project.clientName,
      ClientContact: project.clientContact, ProjectType: project.projectType, Status: project.status,
      Location: project.location, AreaSqft: project.areaSqft, ProjectValue: project.projectValue,
      ApprovedBudget: project.approvedBudget, StartDate: project.startDate,
      TargetCompletionDate: project.targetCompletionDate, Description: project.description };
  });
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, "Projects");
  const output = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new Response(new Uint8Array(output), { status: 200, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": "attachment; filename=projects.xlsx", "Cache-Control": "private, no-store", "X-Request-Id": id } });
}

async function createBoqImport(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, boqImportSchema, id); if (input.response) return input.response;
  if (input.data.projectId) {
    const project = await supabase.from("projects").select("id").eq("workspace_id", scoped.access.workspaceId).eq("id", input.data.projectId).is("archived_at", null).maybeSingle();
    if (!project.data) return fail("VALIDATION_ERROR", "projectId does not identify an active project in this workspace.", 400, id);
  }
  const { data, error } = await supabase.from("boq_imports").insert({
    workspace_id: scoped.access.workspaceId, project_id: input.data.projectId || null, file_name: input.data.fileName,
    file_type: input.data.fileType, row_count: input.data.rowCount, columns: input.data.columns,
    created_by: scoped.access.userId, rows: input.data.rows ?? [],
  }).select("id,file_name,file_type,row_count,columns,created_at").single();
  if (error) {
    console.error(JSON.stringify({ requestId: id, event: "boq_import_create_failed", code: error.code, message: error.message }));
    return fail("VALIDATION_ERROR", "BOQ import could not be saved. Please verify the database migration is applied.", 400, id);
  }
  await audit(supabase, "boq.imported", id);
  return ok(data, 201, id);
}

async function parseBoqWorkbook(request: Request, id: string) {
  let form: FormData;
  try { form = await request.formData(); } catch { return { response: fail("VALIDATION_ERROR", "A multipart form with a file is required.", 400, id) }; }
  const upload = form.get("file");
  if (!(upload instanceof File)) return { response: fail("VALIDATION_ERROR", "The file field is required.", 400, id, { file: ["Choose a CSV, XLS, or XLSX file."] }) };
  const extension = upload.name.split(".").pop()?.toLowerCase();
  if (!extension || !["csv", "xls", "xlsx"].includes(extension)) return { response: fail("VALIDATION_ERROR", "Unsupported spreadsheet type.", 400, id) };
  if (upload.size > 10 * 1024 * 1024) return { response: fail("PAYLOAD_TOO_LARGE", "Spreadsheet files are limited to 10 MB.", 413, id) };
  let workbook: XLSX.WorkBook;
  try { workbook = XLSX.read(Buffer.from(await upload.arrayBuffer()), { type: "buffer", cellDates: true }); }
  catch { return { response: fail("VALIDATION_ERROR", "The spreadsheet could not be read.", 400, id) }; }
  const sheetName = String(form.get("sheet") ?? workbook.SheetNames[0] ?? "");
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { response: fail("VALIDATION_ERROR", "The requested worksheet was not found.", 400, id) };
  const matrix = XLSX.utils.sheet_to_json<Array<string | number | boolean | Date | null>>(sheet, { header: 1, defval: null, raw: true });
  if (matrix.length < 2) return { response: fail("VALIDATION_ERROR", "The worksheet must contain a header and at least one data row.", 400, id) };
  if (matrix.length - 1 > 10_000) return { response: fail("PAYLOAD_TOO_LARGE", "A BOQ import is limited to 10,000 data rows.", 413, id) };
  const columns = matrix[0].map((value, index) => String(value ?? `Column ${index + 1}`).trim()).filter(Boolean);
  if (!columns.length || columns.length > 100 || new Set(columns.map(importKey)).size !== columns.length) return { response: fail("VALIDATION_ERROR", "BOQ headers must be non-empty and unique.", 400, id) };
  const rows = matrix.slice(1).filter((row) => row.some((value) => value !== null && value !== "")).map((row) => columns.map((_, index) => {
    const value = row[index]; return value instanceof Date ? value.toISOString() : value ?? null;
  }));
  const projectIdValue = form.get("projectId");
  const projectId = projectIdValue ? z.string().uuid().safeParse(String(projectIdValue)) : null;
  if (projectId && !projectId.success) return { response: fail("VALIDATION_ERROR", "projectId must be a UUID.", 400, id) };
  return { file: upload, extension: extension as "csv" | "xls" | "xlsx", workbook, sheetName, columns, rows, projectId: projectId?.data };
}

async function previewBoqImport(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const parsedFile = await parseBoqWorkbook(request, id); if ("response" in parsedFile) return parsedFile.response;
  return ok({ fileName: parsedFile.file.name, fileType: parsedFile.extension, sheets: parsedFile.workbook.SheetNames,
    selectedSheet: parsedFile.sheetName, columns: parsedFile.columns, rowCount: parsedFile.rows.length, rows: parsedFile.rows.slice(0, 100) }, 200, id);
}

async function uploadBoqImport(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const parsedFile = await parseBoqWorkbook(request, id); if ("response" in parsedFile) return parsedFile.response;
  if (parsedFile.projectId) {
    const project = await supabase.from("projects").select("id").eq("workspace_id", scoped.access.workspaceId).eq("id", parsedFile.projectId).is("archived_at", null).maybeSingle();
    if (!project.data) return fail("VALIDATION_ERROR", "projectId does not identify an active project in this workspace.", 400, id);
  }
  const result = await supabase.from("boq_imports").insert({ workspace_id: scoped.access.workspaceId, project_id: parsedFile.projectId ?? null,
    file_name: parsedFile.file.name, file_type: parsedFile.extension, row_count: parsedFile.rows.length,
    columns: parsedFile.columns, rows: parsedFile.rows, created_by: scoped.access.userId })
    .select("id,project_id,file_name,file_type,row_count,columns,created_at").single();
  if (result.error) return fail("IMPORT_FAILED", "BOQ spreadsheet could not be saved.", 400, id);
  await audit(supabase, "boq.excel_imported", id);
  return ok(result.data, 201, id);
}

async function dashboardList(request: NextRequest, supabase: SupabaseClient, id: string, name: string) {
  const ctx = await context(supabase, id); if ("response" in ctx) return ctx.response;
  const dashboardContext = ctx.data as { workspace?: { id?: string }; permissions?: { canViewFinancials?: boolean } } | null;
  const workspaceId = dashboardContext?.workspace?.id;
  if (!workspaceId) return fail("FORBIDDEN", "Active workspace membership required.", 403, id);
  const { page, pageSize, from, to } = pagination(request.nextUrl.searchParams);
  if (name !== "notifications") {
    // TODO(PROJECT_BOQ_BACKEND): Replace these demo pages with tenant-scoped domain queries.
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
  if (status && ["draft", "sent", "approved", "revisions", "won", "lost"].includes(status)) query = query.eq("status", status);
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
  const responded = rows.filter((row) => ["approved", "revisions", "won", "lost"].includes(row.status));
  const expiringSoon = rows.filter((row) => row.status === "sent" && row.expiry_date && row.expiry_date >= new Date().toISOString().slice(0, 10) && row.expiry_date <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  return ok({
    total: rows.length,
    totalSent: sent.length,
    winRate: responded.length ? Math.round((rows.filter((row) => row.status === "won").length / responded.length) * 10000) / 100 : 0,
    averageValue: rows.length ? rows.reduce((sum, row) => sum + Number(row.proposed_value), 0) / rows.length : 0,
    pendingResponse: sent.length,
    decidedCount: responded.length,
    expiringSoon: expiringSoon.length,
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
  return {
    id: row.id, folderId: row.folder_id, proposalId: row.proposal_id, projectId: row.project_id, projectName: row.project_name,
    name: row.name, mimeType: row.mime_type, sizeBytes: Number(row.size_bytes), createdAt: row.created_at, updatedAt: row.updated_at
  };
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
  return ok({
    items: (folders.data ?? []).map((folder) => {
      const children = (docs.data ?? []).filter((doc) => doc.folder_id === folder.id);
      return folderDto(folder as Record<string, unknown>, children.length, children.reduce((sum, doc) => sum + Number(doc.size_bytes), 0));
    })
  }, 200, id);
}

async function createFolder(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, folderCreateSchema, id); if (input.response) return input.response;
  if (input.data.parentId) {
    const parent = await supabase.from("document_folders").select("id").eq("workspace_id", scoped.access.workspaceId).eq("id", input.data.parentId).single();
    if (parent.error) return fail("NOT_FOUND", "Parent folder was not found.", 404, id);
  }
  const { data, error } = await supabase.from("document_folders").insert({
    workspace_id: scoped.access.workspaceId, parent_id: input.data.parentId ?? null,
    name: input.data.name, created_by: scoped.access.userId, updated_by: scoped.access.userId
  }).select("id,parent_id,name,created_at,updated_at").single();
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

const allowedDocumentExtensions = new Set(["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx", "xls", "xlsx", "csv", "dwg", "dxf", "txt", "zip"]);

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
  const inserted = await supabase.from("documents").insert({
    workspace_id: scoped.access.workspaceId, folder_id: folderId, proposal_id: proposalId,
    project_id: projectId, project_name: form.get("projectName") ? String(form.get("projectName")).trim().slice(0, 200) : null,
    name: safeName, storage_path: storagePath, mime_type: file.type || "application/octet-stream", size_bytes: file.size,
    checksum_sha256: createHash("sha256").update(bytes).digest("hex"), uploaded_by: scoped.access.userId
  })
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
  const values = {
    ...(input.data.name !== undefined ? { name: input.data.name } : {}), ...(input.data.folderId !== undefined ? { folder_id: input.data.folderId } : {}),
    ...(input.data.projectId !== undefined ? { project_id: input.data.projectId } : {}), ...(input.data.projectName !== undefined ? { project_name: input.data.projectName } : {})
  };
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

// BOQ, Costing, and Reports & Analytics APIs. Calculated money fields are read
// from database expressions or derived from workspace-scoped records here.
const boqSelect = "id,project_id,boq_number,version,assigned_to,source_method,source_template_id,status,markup_percent,tax_percent,created_by,created_at,updated_at";
const num = (value: unknown) => Number(value ?? 0);

function boqDto(row: Record<string, unknown>, roomCount = 0, itemCount = 0, subtotal = 0) {
  const markup = Math.round(subtotal * num(row.markup_percent)) / 100;
  const tax = Math.round((subtotal + markup) * num(row.tax_percent)) / 100;
  return { id: row.id, projectId: row.project_id, boqNumber: row.boq_number, version: row.version,
    assignedTo: row.assigned_to, method: row.source_method, templateId: row.source_template_id, status: row.status,
    markupPercent: num(row.markup_percent), taxPercent: num(row.tax_percent), roomCount, itemCount, subtotal,
    markupAmount: markup, taxAmount: tax, grandTotal: subtotal + markup + tax,
    createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at };
}

async function boqStats(supabase: SupabaseClient, workspaceId: string, boqIds: string[]) {
  if (!boqIds.length) return new Map<string, { rooms: number; items: number; subtotal: number }>();
  const [rooms, items] = await Promise.all([
    supabase.from("boq_rooms").select("id,boq_id").eq("workspace_id", workspaceId).in("boq_id", boqIds),
    supabase.from("boq_items").select("boq_id,amount").eq("workspace_id", workspaceId).in("boq_id", boqIds),
  ]);
  const stats = new Map(boqIds.map((key) => [key, { rooms: 0, items: 0, subtotal: 0 }]));
  for (const row of rooms.data ?? []) stats.get(row.boq_id)!.rooms += 1;
  for (const row of items.data ?? []) { const value = stats.get(row.boq_id)!; value.items += 1; value.subtotal += num(row.amount); }
  return stats;
}

async function listBoqs(request: NextRequest, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { page, pageSize, from, to } = pagination(request.nextUrl.searchParams);
  const status = request.nextUrl.searchParams.get("status"); const projectId = request.nextUrl.searchParams.get("projectId");
  const search = request.nextUrl.searchParams.get("search")?.trim().replace(/[%_,()]/g, " ").slice(0, 120);
  let query = supabase.from("boqs").select(boqSelect, { count: "exact" }).eq("workspace_id", scoped.access.workspaceId)
    .is("archived_at", null).order("updated_at", { ascending: false }).range(from, to);
  if (status && ["draft","in_review","approved"].includes(status)) query = query.eq("status", status);
  if (projectId) query = query.eq("project_id", projectId);
  if (search) query = query.or(`boq_number.ilike.%${search}%,version.ilike.%${search}%`);
  const result = await query; if (result.error) return fail("INTERNAL_ERROR", "BOQs could not be loaded.", 500, id);
  const rows = (result.data ?? []) as Record<string, unknown>[]; const stats = await boqStats(supabase, scoped.access.workspaceId, rows.map((r) => String(r.id)));
  const total = result.count ?? 0;
  return ok({ items: rows.map((row) => { const s = stats.get(String(row.id))!; return boqDto(row, s.rooms, s.items, s.subtotal); }), page, pageSize, total, hasMore: to + 1 < total }, 200, id);
}

async function createBoq(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, boqCreateSchema, id); if (input.response) return input.response;
  const project = await supabase.from("projects").select("id").eq("workspace_id", scoped.access.workspaceId).eq("id", input.data.projectId).is("archived_at", null).maybeSingle();
  if (!project.data) return fail("NOT_FOUND", "Project was not found.", 404, id);
  const template = input.data.method === "template" && input.data.templateId
    ? await supabase.from("boq_templates").select("snapshot,use_count").eq("workspace_id", scoped.access.workspaceId).eq("id", input.data.templateId).maybeSingle()
    : null;
  if (template && !template.data) return fail("NOT_FOUND", "BOQ template was not found.", 404, id);
  const inserted = await supabase.from("boqs").insert({ workspace_id: scoped.access.workspaceId, project_id: input.data.projectId,
    boq_number: input.data.boqNumber, version: input.data.version, assigned_to: input.data.assignedTo,
    source_method: input.data.method, source_template_id: input.data.templateId, markup_percent: input.data.markupPercent,
    tax_percent: input.data.taxPercent, created_by: scoped.access.userId, updated_by: scoped.access.userId }).select(boqSelect).single();
  if (inserted.error) return fail(inserted.error.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR", inserted.error.code === "23505" ? "This BOQ number and version already exist." : "BOQ could not be created.", inserted.error.code === "23505" ? 409 : 400, id);
  if (input.data.method === "template" && input.data.templateId) {
    if (template?.data && Array.isArray(template.data.snapshot)) {
      for (const sourceRoom of template.data.snapshot as Array<Record<string, unknown>>) {
        const room = await supabase.from("boq_rooms").insert({ workspace_id: scoped.access.workspaceId, boq_id: inserted.data.id, name: sourceRoom.name, description: sourceRoom.description }).select("id").single();
        if (!room.data) continue;
        for (const sourceCategory of (sourceRoom.categories as Array<Record<string, unknown>> | undefined) ?? []) {
          const category = await supabase.from("boq_categories").insert({ workspace_id: scoped.access.workspaceId, boq_id: inserted.data.id, room_id: room.data.id, name: sourceCategory.name, description: sourceCategory.description }).select("id").single();
          if (!category.data) continue;
          const items = ((sourceCategory.items as Array<Record<string, unknown>> | undefined) ?? []).map((item) => ({ ...item, id: undefined, amount: undefined, workspace_id: scoped.access.workspaceId, boq_id: inserted.data.id, room_id: room.data.id, category_id: category.data.id }));
          if (items.length) await supabase.from("boq_items").insert(items);
        }
      }
      await supabase.from("boq_templates").update({ use_count: num(template.data.use_count) + 1 }).eq("id", input.data.templateId);
    }
  }
  await audit(supabase, "boq.created", id); return ok(boqDto(inserted.data as Record<string, unknown>), 201, id);
}

async function getBoq(supabase: SupabaseClient, id: string, boqId: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const [boq, rooms, categories, items] = await Promise.all([
    supabase.from("boqs").select(boqSelect).eq("workspace_id", scoped.access.workspaceId).eq("id", boqId).is("archived_at", null).maybeSingle(),
    supabase.from("boq_rooms").select("id,name,description,sort_order,created_at,updated_at").eq("workspace_id", scoped.access.workspaceId).eq("boq_id", boqId).order("sort_order"),
    supabase.from("boq_categories").select("id,room_id,name,description,sort_order").eq("workspace_id", scoped.access.workspaceId).eq("boq_id", boqId).order("sort_order"),
    supabase.from("boq_items").select("id,room_id,category_id,name,description,unit,quantity,rate,waste_percent,tax_percent,amount,sort_order").eq("workspace_id", scoped.access.workspaceId).eq("boq_id", boqId).order("sort_order"),
  ]);
  if (boq.error || rooms.error || categories.error || items.error) return fail("INTERNAL_ERROR", "BOQ could not be loaded.", 500, id);
  if (!boq.data) return fail("NOT_FOUND", "BOQ was not found.", 404, id);
  const itemRows = items.data ?? []; const subtotal = itemRows.reduce((sum, row) => sum + num(row.amount), 0);
  return ok({ ...boqDto(boq.data as Record<string, unknown>, rooms.data?.length ?? 0, itemRows.length, subtotal), rooms: (rooms.data ?? []).map((room) => ({ ...room,
    categories: (categories.data ?? []).filter((cat) => cat.room_id === room.id).map((category) => ({ ...category, items: itemRows.filter((item) => item.category_id === category.id) })) })) }, 200, id);
}

async function updateBoq(request: Request, supabase: SupabaseClient, id: string, boqId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, boqPatchSchema, id); if (input.response) return input.response;
  const map: Record<string,string> = { version: "version", assignedTo: "assigned_to", markupPercent: "markup_percent", taxPercent: "tax_percent" };
  const values = Object.fromEntries(Object.entries(input.data).map(([k,v]) => [map[k],v])); values.updated_by = scoped.access.userId;
  const result = await supabase.from("boqs").update(values).eq("workspace_id", scoped.access.workspaceId).eq("id", boqId).is("archived_at", null).select(boqSelect).maybeSingle();
  if (result.error) return fail("VALIDATION_ERROR", "BOQ could not be updated.", 400, id);
  return result.data ? ok(boqDto(result.data as Record<string, unknown>), 200, id) : fail("NOT_FOUND", "BOQ was not found.", 404, id);
}

async function setBoqStatus(request: Request, supabase: SupabaseClient, id: string, boqId: string) {
  const input = await parsed(request, boqStatusSchema, id); if (input.response) return input.response;
  const admin = input.data.status === "approved" || input.data.status === "archived";
  const scoped = await workspaceAccess(supabase, id, true, admin); if ("response" in scoped) return scoped.response;
  const result = await supabase.from("boqs").update({ status: input.data.status, archived_at: input.data.status === "archived" ? new Date().toISOString() : null, updated_by: scoped.access.userId })
    .eq("workspace_id", scoped.access.workspaceId).eq("id", boqId).is("archived_at", null).select(boqSelect).maybeSingle();
  if (result.error) return fail("VALIDATION_ERROR", "BOQ status could not be changed.", 400, id);
  return result.data ? ok(boqDto(result.data as Record<string, unknown>), 200, id) : fail("NOT_FOUND", "BOQ was not found.", 404, id);
}

async function duplicateBoq(supabase: SupabaseClient, id: string, boqId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const detailResponse = await getBoq(supabase, id, boqId); const payload = await detailResponse.json();
  if (!detailResponse.ok) return detailResponse; const source = payload.data as Record<string, unknown>;
  const created = await supabase.from("boqs").insert({ workspace_id: scoped.access.workspaceId, project_id: source.projectId, boq_number: `${source.boqNumber}-COPY-${Date.now().toString().slice(-5)}`,
    version: source.version, assigned_to: source.assignedTo, source_method: "blank", markup_percent: source.markupPercent, tax_percent: source.taxPercent,
    created_by: scoped.access.userId, updated_by: scoped.access.userId }).select(boqSelect).single();
  if (created.error) return fail("VALIDATION_ERROR", "BOQ could not be duplicated.", 400, id);
  for (const sourceRoom of source.rooms as Array<Record<string, unknown>>) {
    const room = await supabase.from("boq_rooms").insert({ workspace_id: scoped.access.workspaceId, boq_id: created.data.id, name: sourceRoom.name, description: sourceRoom.description, sort_order: sourceRoom.sort_order }).select("id").single();
    for (const sourceCategory of sourceRoom.categories as Array<Record<string, unknown>>) {
      const category = await supabase.from("boq_categories").insert({ workspace_id: scoped.access.workspaceId, boq_id: created.data.id, room_id: room.data!.id, name: sourceCategory.name, description: sourceCategory.description, sort_order: sourceCategory.sort_order }).select("id").single();
      const copiedItems = (sourceCategory.items as Array<Record<string, unknown>>).map((item) => ({ workspace_id: scoped.access.workspaceId, boq_id: created.data.id, room_id: room.data!.id, category_id: category.data!.id,
        name: item.name, description: item.description, unit: item.unit, quantity: item.quantity, rate: item.rate, waste_percent: item.waste_percent, tax_percent: item.tax_percent, sort_order: item.sort_order }));
      if (copiedItems.length) await supabase.from("boq_items").insert(copiedItems);
    }
  }
  return ok(boqDto(created.data as Record<string, unknown>), 201, id);
}

async function boqTemplates(request: NextRequest, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, request.method === "POST"); if ("response" in scoped) return scoped.response;
  if (request.method === "GET") {
    const { page,pageSize,from,to } = pagination(request.nextUrl.searchParams);
    const result = await supabase.from("boq_templates").select("id,name,description,tags,use_count,created_at,updated_at", { count:"exact" }).eq("workspace_id",scoped.access.workspaceId).order("use_count",{ascending:false}).range(from,to);
    const total=result.count??0; return result.error?fail("INTERNAL_ERROR","BOQ templates could not be loaded.",500,id):ok({items:result.data??[],page,pageSize,total,hasMore:to+1<total},200,id);
  }
  const input=await parsed(request,boqTemplateSchema,id);if(input.response)return input.response;
  const detailResponse=await getBoq(supabase,id,input.data.boqId);const payload=await detailResponse.json();if(!detailResponse.ok)return detailResponse;
  const result=await supabase.from("boq_templates").insert({workspace_id:scoped.access.workspaceId,name:input.data.name,description:input.data.description,tags:input.data.tags,snapshot:payload.data.rooms,created_by:scoped.access.userId}).select("id,name,description,tags,use_count,created_at,updated_at").single();
  return result.error?fail(result.error.code==="23505"?"CONFLICT":"VALIDATION_ERROR","BOQ template could not be created.",result.error.code==="23505"?409:400,id):ok(result.data,201,id);
}

async function boqChild(request: Request, supabase: SupabaseClient, id: string, boqId: string, kind: "room"|"category"|"item", parentId?: string, childId?: string) {
  const scoped = await workspaceAccess(supabase, id, request.method !== "GET", request.method === "DELETE"); if ("response" in scoped) return scoped.response;
  const config = kind === "room" ? { table: "boq_rooms", schema: boqRoomSchema } : kind === "category" ? { table: "boq_categories", schema: boqCategorySchema } : { table: "boq_items", schema: boqItemSchema };
  if (request.method === "POST") {
    const input = await parsed(request, config.schema, id); if (input.response) return input.response;
    const data = input.data as Record<string, unknown>;
    const values: Record<string, unknown> = { workspace_id: scoped.access.workspaceId, boq_id: boqId, ...(kind === "category" ? { room_id: parentId } : {}), ...(kind === "item" ? { category_id: parentId } : {}) };
    if (kind === "item") {
      const category = await supabase.from("boq_categories").select("room_id").eq("workspace_id", scoped.access.workspaceId).eq("boq_id", boqId).eq("id", parentId!).maybeSingle();
      if (!category.data) return fail("NOT_FOUND", "BOQ category was not found.", 404, id);
      Object.assign(values, { room_id: category.data.room_id, name: data.name, description: data.description, unit: data.unit, quantity: data.quantity, rate: data.rate, waste_percent: data.wastePercent, tax_percent: data.taxPercent, sort_order: data.sortOrder });
    } else Object.assign(values, data);
    const result = await supabase.from(config.table).insert(values).select("*").single();
    return result.error ? fail("VALIDATION_ERROR", `BOQ ${kind} could not be created.`, 400, id) : ok(result.data, 201, id);
  }
  if (request.method === "PATCH" && childId) {
    const input = await parsed(request, config.schema.partial().strict().refine((v) => Object.keys(v).length > 0), id); if (input.response) return input.response;
    const data = input.data as Record<string, unknown>;
    const values = kind === "item" ? { name: data.name, description: data.description, unit: data.unit, quantity: data.quantity, rate: data.rate, waste_percent: data.wastePercent, tax_percent: data.taxPercent, sort_order: data.sortOrder } : data;
    const clean = Object.fromEntries(Object.entries(values).filter(([,v]) => v !== undefined));
    const result = await supabase.from(config.table).update(clean).eq("workspace_id", scoped.access.workspaceId).eq("boq_id", boqId).eq("id", childId).select("*").maybeSingle();
    return result.data ? ok(result.data, 200, id) : fail("NOT_FOUND", `BOQ ${kind} was not found.`, 404, id);
  }
  if (request.method === "DELETE" && childId) {
    const result = await supabase.from(config.table).delete().eq("workspace_id", scoped.access.workspaceId).eq("boq_id", boqId).eq("id", childId).select("id").maybeSingle();
    return result.data ? ok({ deleted: true, id: childId }, 200, id) : fail("NOT_FOUND", `BOQ ${kind} was not found.`, 404, id);
  }
  return methodNotAllowed(id);
}

function costingCategoryValues(input: Record<string, unknown>, userId: string) {
  const map: Record<string,string> = { name:"name",code:"code",parentId:"parent_id",defaultUnit:"default_unit",defaultTaxPercent:"default_tax_percent",defaultMarkupPercent:"default_markup_percent",defaultWastePercent:"default_waste_percent",transportIncluded:"transport_included",labourIncluded:"labour_included",description:"description" };
  return { ...Object.fromEntries(Object.entries(input).map(([k,v]) => [map[k],v]).filter(([k]) => k)), updated_by: userId };
}
function costingItemValues(input: Record<string, unknown>, userId: string) {
  const map: Record<string,string> = { name:"name",code:"code",categoryId:"category_id",unit:"unit",baseCost:"base_cost",sellingRate:"selling_rate",preferredVendor:"preferred_vendor",spec:"spec",rateStatus:"rate_status",imageUrl:"image_url" };
  return { ...Object.fromEntries(Object.entries(input).map(([k,v]) => [map[k],v]).filter(([k]) => k)), updated_by: userId };
}

async function costingCategories(request: NextRequest, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { page,pageSize,from,to } = pagination(request.nextUrl.searchParams); const search = request.nextUrl.searchParams.get("search")?.trim().replace(/[%_,()]/g," ").slice(0,120);
  let query = supabase.from("costing_categories").select("*", { count:"exact" }).eq("workspace_id", scoped.access.workspaceId).order("updated_at", { ascending:false }).range(from,to);
  if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`); const result = await query;
  if (result.error) return fail("INTERNAL_ERROR", "Costing categories could not be loaded.", 500, id);
  const [all, items] = await Promise.all([supabase.from("costing_categories").select("id,parent_id").eq("workspace_id", scoped.access.workspaceId), supabase.from("costing_items").select("id,category_id").eq("workspace_id", scoped.access.workspaceId).is("archived_at",null)]);
  const total=result.count??0; return ok({ items:(result.data??[]).map((row)=>({...row,subCategoryCount:(all.data??[]).filter((x)=>x.parent_id===row.id).length,itemCount:(items.data??[]).filter((x)=>x.category_id===row.id).length})),page,pageSize,total,hasMore:to+1<total },200,id);
}
async function createCostingCategory(request: Request, supabase: SupabaseClient, id: string) {
  const scoped=await workspaceAccess(supabase,id,true); if("response" in scoped)return scoped.response; const input=await parsed(request,costingCategorySchema,id);if(input.response)return input.response;
  const result=await supabase.from("costing_categories").insert({workspace_id:scoped.access.workspaceId,created_by:scoped.access.userId,...costingCategoryValues(input.data,scoped.access.userId)}).select("*").single();
  return result.error?fail(result.error.code==="23505"?"CONFLICT":"VALIDATION_ERROR","Costing category could not be created.",result.error.code==="23505"?409:400,id):ok(result.data,201,id);
}
async function costingCategoryDetail(request: Request,supabase:SupabaseClient,id:string,categoryId:string){
  const scoped=await workspaceAccess(supabase,id,request.method!=="GET",request.method==="DELETE");if("response" in scoped)return scoped.response;
  if(request.method==="GET"){const [category,children,items]=await Promise.all([supabase.from("costing_categories").select("*").eq("workspace_id",scoped.access.workspaceId).eq("id",categoryId).maybeSingle(),supabase.from("costing_categories").select("*").eq("workspace_id",scoped.access.workspaceId).eq("parent_id",categoryId),supabase.from("costing_items").select("*").eq("workspace_id",scoped.access.workspaceId).eq("category_id",categoryId).is("archived_at",null)]);if(!category.data)return fail("NOT_FOUND","Costing category was not found.",404,id);return ok({...category.data,subCategories:children.data??[],items:(items.data??[]).map((x)=>({...x,marginPercent:num(x.selling_rate)?Math.round((num(x.selling_rate)-num(x.base_cost))*10000/num(x.selling_rate))/100:0}))},200,id)}
  if(request.method==="PATCH"){const input=await parsed(request,costingCategoryPatchSchema,id);if(input.response)return input.response;const result=await supabase.from("costing_categories").update(costingCategoryValues(input.data,scoped.access.userId)).eq("workspace_id",scoped.access.workspaceId).eq("id",categoryId).select("*").maybeSingle();return result.data?ok(result.data,200,id):fail("NOT_FOUND","Costing category was not found.",404,id)}
  const result=await supabase.from("costing_categories").delete().eq("workspace_id",scoped.access.workspaceId).eq("id",categoryId).select("id").maybeSingle();return result.data?ok({deleted:true,id:categoryId},200,id):fail("VALIDATION_ERROR","Category is missing or still has dependent records.",400,id)
}

async function costingItems(request: NextRequest,supabase:SupabaseClient,id:string){
  const scoped=await workspaceAccess(supabase,id);if("response" in scoped)return scoped.response;const{page,pageSize,from,to}=pagination(request.nextUrl.searchParams);const categoryId=request.nextUrl.searchParams.get("categoryId");const search=request.nextUrl.searchParams.get("search")?.trim().replace(/[%_,()]/g," ").slice(0,120);
  let query=supabase.from("costing_items").select("*",{count:"exact"}).eq("workspace_id",scoped.access.workspaceId).is("archived_at",null).order("updated_at",{ascending:false}).range(from,to);if(categoryId)query=query.eq("category_id",categoryId);if(search)query=query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);const result=await query;if(result.error)return fail("INTERNAL_ERROR","Costing items could not be loaded.",500,id);const total=result.count??0;return ok({items:(result.data??[]).map((x)=>({...x,marginPercent:num(x.selling_rate)?Math.round((num(x.selling_rate)-num(x.base_cost))*10000/num(x.selling_rate))/100:0})),page,pageSize,total,hasMore:to+1<total},200,id)
}
async function createCostingItem(request:Request,supabase:SupabaseClient,id:string){const scoped=await workspaceAccess(supabase,id,true);if("response" in scoped)return scoped.response;const input=await parsed(request,costingItemSchema,id);if(input.response)return input.response;const result=await supabase.from("costing_items").insert({workspace_id:scoped.access.workspaceId,created_by:scoped.access.userId,...costingItemValues(input.data,scoped.access.userId)}).select("*").single();return result.error?fail(result.error.code==="23505"?"CONFLICT":"VALIDATION_ERROR","Costing item could not be created.",result.error.code==="23505"?409:400,id):ok(result.data,201,id)}
async function costingItemDetail(request:Request,supabase:SupabaseClient,id:string,itemId:string){const scoped=await workspaceAccess(supabase,id,request.method!=="GET",request.method==="DELETE");if("response" in scoped)return scoped.response;if(request.method==="GET"){const [item,quotes]=await Promise.all([supabase.from("costing_items").select("*").eq("workspace_id",scoped.access.workspaceId).eq("id",itemId).is("archived_at",null).maybeSingle(),supabase.from("vendor_quotes").select("*").eq("workspace_id",scoped.access.workspaceId).eq("item_id",itemId).order("quote")]);return item.data?ok({...item.data,vendorQuotes:quotes.data??[]},200,id):fail("NOT_FOUND","Costing item was not found.",404,id)}if(request.method==="PATCH"){const input=await parsed(request,costingItemPatchSchema,id);if(input.response)return input.response;const result=await supabase.from("costing_items").update(costingItemValues(input.data,scoped.access.userId)).eq("workspace_id",scoped.access.workspaceId).eq("id",itemId).is("archived_at",null).select("*").maybeSingle();return result.data?ok(result.data,200,id):fail("NOT_FOUND","Costing item was not found.",404,id)}const result=await supabase.from("costing_items").update({archived_at:new Date().toISOString(),updated_by:scoped.access.userId}).eq("workspace_id",scoped.access.workspaceId).eq("id",itemId).is("archived_at",null).select("id").maybeSingle();return result.data?ok({archived:true,id:itemId},200,id):fail("NOT_FOUND","Costing item was not found.",404,id)}

async function addVendorQuote(request:Request,supabase:SupabaseClient,id:string){const scoped=await workspaceAccess(supabase,id,true);if("response" in scoped)return scoped.response;const input=await parsed(request,vendorQuoteSchema,id);if(input.response)return input.response;const result=await supabase.from("vendor_quotes").insert({workspace_id:scoped.access.workspaceId,item_id:input.data.itemId,vendor_name:input.data.vendorName,quote:input.data.quote,lead_time_days:input.data.leadTimeDays,rating:input.data.rating,created_by:scoped.access.userId}).select("*").single();return result.error?fail("VALIDATION_ERROR","Vendor quote could not be created.",400,id):ok(result.data,201,id)}
async function selectVendorQuote(request:Request,supabase:SupabaseClient,id:string,quoteId:string){const scoped=await workspaceAccess(supabase,id,true);if("response" in scoped)return scoped.response;const input=await parsed(request,vendorSelectionSchema,id);if(input.response)return input.response;const quote=await supabase.from("vendor_quotes").select("item_id").eq("workspace_id",scoped.access.workspaceId).eq("id",quoteId).maybeSingle();if(!quote.data)return fail("NOT_FOUND","Vendor quote was not found.",404,id);if(input.data.selected)await supabase.from("vendor_quotes").update({selected:false}).eq("workspace_id",scoped.access.workspaceId).eq("item_id",quote.data.item_id);const result=await supabase.from("vendor_quotes").update({selected:input.data.selected}).eq("workspace_id",scoped.access.workspaceId).eq("id",quoteId).select("*").single();return result.error?fail("VALIDATION_ERROR","Vendor selection could not be saved.",400,id):ok(result.data,200,id)}

async function costingScenarios(request:NextRequest,supabase:SupabaseClient,id:string){const scoped=await workspaceAccess(supabase,id);if("response" in scoped)return scoped.response;const{page,pageSize,from,to}=pagination(request.nextUrl.searchParams);const result=await supabase.from("costing_scenarios").select("*",{count:"exact"}).eq("workspace_id",scoped.access.workspaceId).is("archived_at",null).order("updated_at",{ascending:false}).range(from,to);if(result.error)return fail("INTERNAL_ERROR","Costing scenarios could not be loaded.",500,id);const total=result.count??0;return ok({items:result.data??[],page,pageSize,total,hasMore:to+1<total},200,id)}
async function createCostingScenario(request:Request,supabase:SupabaseClient,id:string){const scoped=await workspaceAccess(supabase,id,true);if("response" in scoped)return scoped.response;const input=await parsed(request,costingScenarioSchema,id);if(input.response)return input.response;const result=await supabase.from("costing_scenarios").insert({workspace_id:scoped.access.workspaceId,boq_id:input.data.boqId,name:input.data.name,description:input.data.description,scenario_type:input.data.type,adjustments:input.data.adjustments,created_by:scoped.access.userId,updated_by:scoped.access.userId}).select("*").single();return result.error?fail("VALIDATION_ERROR","Costing scenario could not be created.",400,id):ok(result.data,201,id)}
async function costingScenarioDetail(request:Request,supabase:SupabaseClient,id:string,scenarioId:string,duplicate=false){const scoped=await workspaceAccess(supabase,id,request.method!=="GET"||duplicate);if("response" in scoped)return scoped.response;const source=await supabase.from("costing_scenarios").select("*").eq("workspace_id",scoped.access.workspaceId).eq("id",scenarioId).is("archived_at",null).maybeSingle();if(!source.data)return fail("NOT_FOUND","Costing scenario was not found.",404,id);if(duplicate){const result=await supabase.from("costing_scenarios").insert({...source.data,id:undefined,name:`${source.data.name} (Copy)`,created_at:undefined,updated_at:undefined,created_by:scoped.access.userId,updated_by:scoped.access.userId}).select("*").single();return result.error?fail("VALIDATION_ERROR","Scenario could not be duplicated.",400,id):ok(result.data,201,id)}if(request.method==="PATCH"){const input=await parsed(request,costingScenarioPatchSchema,id);if(input.response)return input.response;const values:Record<string,unknown>={...input.data,scenario_type:input.data.type,boq_id:input.data.boqId,updated_by:scoped.access.userId};delete values.type;delete values.boqId;const result=await supabase.from("costing_scenarios").update(values).eq("id",scenarioId).select("*").single();return result.error?fail("VALIDATION_ERROR","Scenario could not be updated.",400,id):ok(result.data,200,id)}
  const items=await supabase.from("boq_items").select("amount").eq("workspace_id",scoped.access.workspaceId).eq("boq_id",source.data.boq_id);const baseCost=(items.data??[]).reduce((s,x)=>s+num(x.amount),0);const adjustments=source.data.adjustments as Array<Record<string,unknown>>;const scenarioCost=Math.max(0,baseCost+adjustments.reduce((s,x)=>s+(x.rate==null?0:num(x.rate)),0));return ok({...source.data,baseCost,scenarioCost,savings:baseCost-scenarioCost,baseMargin:null,scenarioMargin:null},200,id)}

async function costingAnalysis(supabase:SupabaseClient,id:string){const scoped=await workspaceAccess(supabase,id);if("response" in scoped)return scoped.response;const [projects,boqs,items,quotes]=await Promise.all([supabase.from("projects").select("approved_budget").eq("workspace_id",scoped.access.workspaceId).is("archived_at",null),supabase.from("boqs").select("id").eq("workspace_id",scoped.access.workspaceId).is("archived_at",null),supabase.from("costing_items").select("id,category_id,base_cost,selling_rate").eq("workspace_id",scoped.access.workspaceId).is("archived_at",null),supabase.from("vendor_quotes").select("item_id,vendor_name,quote,lead_time_days,rating,selected").eq("workspace_id",scoped.access.workspaceId)]);const boqIds=(boqs.data??[]).map(x=>x.id);const amounts=boqIds.length?await supabase.from("boq_items").select("amount,category_id").eq("workspace_id",scoped.access.workspaceId).in("boq_id",boqIds):{data:[]};const totalBudget=(projects.data??[]).reduce((s,x)=>s+num(x.approved_budget),0);const actualCost=(amounts.data??[]).reduce((s,x)=>s+num(x.amount),0);const committed=(quotes.data??[]).filter(x=>x.selected).reduce((s,x)=>s+num(x.quote),0);return ok({currency:scoped.access.currency,summary:{totalBudget,actualCost,committed,forecast:Math.max(actualCost,committed),variance:totalBudget-Math.max(actualCost,committed)},items:items.data??[],vendorQuotes:quotes.data??[],varianceByCategory:[]},200,id)}
async function marginAnalysis(supabase:SupabaseClient,id:string){const scoped=await workspaceAccess(supabase,id);if("response" in scoped)return scoped.response;const [categories,items]=await Promise.all([supabase.from("costing_categories").select("id,name,default_markup_percent").eq("workspace_id",scoped.access.workspaceId),supabase.from("costing_items").select("id,name,category_id,base_cost,selling_rate").eq("workspace_id",scoped.access.workspaceId).is("archived_at",null)]);const rows=(items.data??[]).map(x=>({...x,marginPercent:num(x.selling_rate)?(num(x.selling_rate)-num(x.base_cost))*100/num(x.selling_rate):0}));const revenue=rows.reduce((s,x)=>s+num(x.selling_rate),0),cost=rows.reduce((s,x)=>s+num(x.base_cost),0),currentMargin=revenue?(revenue-cost)*100/revenue:0,targetMargin=(categories.data??[]).length?(categories.data??[]).reduce((s,x)=>s+num(x.default_markup_percent),0)/(categories.data??[]).length:0;return ok({currency:scoped.access.currency,targetMargin,currentMargin,marginDifference:currentMargin-targetMargin,lowMarginItems:rows.filter(x=>x.marginPercent<targetMargin),byCategory:(categories.data??[]).map(c=>{const group=rows.filter(x=>x.category_id===c.id);return{id:c.id,name:c.name,marginPercent:group.length?group.reduce((s,x)=>s+x.marginPercent,0)/group.length:0}}),impactDrivers:[],trend:[]},200,id)}

async function reportsAnalytics(request: NextRequest, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, false, true); if ("response" in scoped) return scoped.response;
  const requested = request.nextUrl.searchParams.get("period"); const period = ["month","quarter","year"].includes(requested ?? "") ? requested! : "year";
  const months = period === "month" ? 1 : period === "quarter" ? 3 : 12; const start = new Date(); start.setUTCDate(1); start.setUTCHours(0,0,0,0); start.setUTCMonth(start.getUTCMonth() - months + 1);
  const [projectsResult, boqsResult, invoicesResult, costsResult, membershipsResult] = await Promise.all([
    supabase.from("projects").select("id,project_type,client_name,project_value,status,assigned_designer_id,created_at").eq("workspace_id",scoped.access.workspaceId).is("archived_at",null).gte("created_at",start.toISOString()),
    supabase.from("boqs").select("id,created_by,status,created_at").eq("workspace_id",scoped.access.workspaceId).is("archived_at",null).gte("created_at",start.toISOString()),
    supabase.from("invoices").select("client_name,subtotal,total_amount,status,created_at").eq("workspace_id",scoped.access.workspaceId).is("archived_at",null).gte("created_at",start.toISOString()),
    supabase.from("boq_items").select("amount,created_at").eq("workspace_id",scoped.access.workspaceId).gte("created_at",start.toISOString()),
    supabase.from("workspace_memberships").select("user_id,role").eq("workspace_id",scoped.access.workspaceId).eq("status","active"),
  ]);
  if ([projectsResult,boqsResult,invoicesResult,costsResult,membershipsResult].some((result)=>result.error)) return fail("INTERNAL_ERROR","Reports could not be loaded.",500,id);
  const projects=projectsResult.data??[],boqs=boqsResult.data??[],invoices=(invoicesResult.data??[]).filter(x=>x.status!=="void"),costRows=costsResult.data??[];
  const revenue=invoices.reduce((sum,row)=>sum+num(row.subtotal),0),cost=costRows.reduce((sum,row)=>sum+num(row.amount),0);
  const bucketKeys=Array.from({length:months},(_,index)=>{const date=new Date(start);date.setUTCMonth(start.getUTCMonth()+index);return date.toISOString().slice(0,7)});
  const monthlyRevenueVsCost=bucketKeys.map((key)=>({period:key,revenue:invoices.filter(x=>String(x.created_at).startsWith(key)).reduce((s,x)=>s+num(x.subtotal),0),cost:costRows.filter(x=>String(x.created_at).startsWith(key)).reduce((s,x)=>s+num(x.amount),0)}));
  const grossMarginTrend=monthlyRevenueVsCost.map((point)=>({period:point.period,marginPercent:point.revenue?(point.revenue-point.cost)*100/point.revenue:0}));
  const types=new Map<string,{projects:number,value:number}>();for(const project of projects){const key=project.project_type??"Other",value=types.get(key)??{projects:0,value:0};value.projects++;value.value+=num(project.project_value);types.set(key,value)}
  const clients=new Map<string,{projects:number,totalValue:number,revenue:number}>();for(const project of projects){const value=clients.get(project.client_name)??{projects:0,totalValue:0,revenue:0};value.projects++;value.totalValue+=num(project.project_value);clients.set(project.client_name,value)}for(const invoice of invoices){const value=clients.get(invoice.client_name)??{projects:0,totalValue:0,revenue:0};value.revenue+=num(invoice.subtotal);clients.set(invoice.client_name,value)}
  const teamPerformance=(membershipsResult.data??[]).map((member)=>{const memberProjects=projects.filter(x=>x.assigned_designer_id===member.user_id),memberBoqs=boqs.filter(x=>x.created_by===member.user_id);return{userId:member.user_id,role:member.role,projects:memberProjects.length,boqs:memberBoqs.length,projectValue:memberProjects.reduce((s,x)=>s+num(x.project_value),0),rating:null}});
  return ok({scope:{workspaceId:scoped.access.workspaceId,currency:scoped.access.currency,period,from:start.toISOString(),generatedAt:new Date().toISOString()},kpis:{totalRevenue:revenue,totalCost:cost,grossMarginPercent:revenue?(revenue-cost)*100/revenue:0,averageProjectValue:projects.length?projects.reduce((s,x)=>s+num(x.project_value),0)/projects.length:0},monthlyRevenueVsCost,grossMarginTrend,projectsByType:Array.from(types,([type,value])=>({type,...value})),pipelineByType:Array.from(types,([type,value])=>({type,...value})),teamPerformance,clientAnalysis:Array.from(clients,([client,value])=>({client,...value,marginPercent:value.revenue?null:null})),counts:{projects:projects.length,boqs:boqs.length}},200,id);
}

async function costingSettings(supabase:SupabaseClient,id:string){const scoped=await workspaceAccess(supabase,id);if("response" in scoped)return scoped.response;const [categories,items,quotes,scenarios]=await Promise.all([supabase.from("costing_categories").select("id,default_unit,default_tax_percent,default_markup_percent,default_waste_percent").eq("workspace_id",scoped.access.workspaceId),supabase.from("costing_items").select("id,rate_status").eq("workspace_id",scoped.access.workspaceId).is("archived_at",null),supabase.from("vendor_quotes").select("id").eq("workspace_id",scoped.access.workspaceId),supabase.from("costing_scenarios").select("id").eq("workspace_id",scoped.access.workspaceId).is("archived_at",null)]);const missingDefaults=(categories.data??[]).filter(x=>!x.default_unit).length;return ok({scope:"workspace",health:{completenessPercent:(categories.data??[]).length?Math.round(((categories.data??[]).length-missingDefaults)*100/(categories.data??[]).length):100,categoryCount:categories.data?.length??0,itemCount:items.data?.length??0,vendorQuoteCount:quotes.data?.length??0,scenarioCount:scenarios.data?.length??0,missingCategoryDefaults:missingDefaults,expiredRates:(items.data??[]).filter(x=>x.rate_status==="expired").length},sections:["general","units","currencies","cost_codes","taxes","markups","pricing_rules","category_defaults","wastage_rules","margin_rules","discount_policies","rate_management","approval_workflows","versioning","permissions","import_export","audit_log"]},200,id)}

function basicTextPdf(lines:string[]){const commands=lines.map((line,index)=>`BT /F1 ${index===0?18:11} Tf 50 ${770-index*24} Td (${pdfEscape(line).slice(0,105)}) Tj ET`).join("\n");const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",`<< /Length ${Buffer.byteLength(commands,"ascii")} >>\nstream\n${commands}\nendstream`];let output="%PDF-1.4\n";const offsets=[0];objects.forEach((object,index)=>{offsets.push(Buffer.byteLength(output,"ascii"));output+=`${index+1} 0 obj\n${object}\nendobj\n`});const xref=Buffer.byteLength(output,"ascii");output+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,"0")} 00000 n `).join("\n")}\n`;output+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Uint8Array(Buffer.from(output,"ascii"))}
async function reportsPdf(request:NextRequest,supabase:SupabaseClient,id:string){const response=await reportsAnalytics(request,supabase,id);if(!response.ok)return response;const payload=await response.json();const report=payload.data;return new Response(basicTextPdf(["Reports & Analytics",`Period: ${report.scope.period}`,`Revenue: ${report.scope.currency} ${report.kpis.totalRevenue.toFixed(2)}`,`Cost: ${report.scope.currency} ${report.kpis.totalCost.toFixed(2)}`,`Gross margin: ${report.kpis.grossMarginPercent.toFixed(2)}%`,`Average project value: ${report.scope.currency} ${report.kpis.averageProjectValue.toFixed(2)}`,`Projects: ${report.counts.projects}`,`BOQs: ${report.counts.boqs}`]),{status:200,headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=reports-analytics.pdf","Cache-Control":"private, no-store","X-Request-Id":id}})}

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
  if (type && ["invoice", "pro_forma", "quote"].includes(type)) query = query.eq("document_type", type);
  if (status === "overdue") query = query.in("status", ["pending", "sent", "partial"]).lt("due_date", new Date().toISOString().slice(0, 10));
  else if (status && ["draft", "pending", "sent", "accepted", "partial", "paid", "void"].includes(status)) query = query.eq("status", status);
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
  return ok({
    totalInvoices: rows.length, totalInvoiced, collected, outstanding: totalInvoiced - collected,
    overdue: overdue.reduce((sum, row) => sum + Number(row.total_amount) - Number(row.total_paid), 0), overdueCount: overdue.length, currency: scoped.access.currency
  }, 200, id);
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
  if (["paid", "void"].includes(String(current.storedStatus))) return fail("CONFLICT", "Paid or void invoices cannot be edited.", 409, id);
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
    `Address: ${[address?.line1, address?.line2, address?.city, address?.state, address?.pincode].filter(Boolean).join(", ")}`,
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
  return new Response(basicInvoicePdf(invoice as typeof invoice & Record<string, unknown>), {
    status: 200, headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=\"${pdfEscape(invoice.invoiceNumber)}.pdf\"`,
      "Cache-Control": "private, no-store", "X-Request-Id": id,
    }
  });
}

const projectTemplateSelect = "id,template_code,name,description,business_type,project_type,team,region,visibility,image_url,tags,status,current_version,structure,costing_boq,workflow,documents,use_count,last_used_at,published_at,created_by,updated_by,created_at,updated_at";

function projectTemplateDto(row: Record<string, unknown>, includeContent = false) {
  const structure = (row.structure ?? {}) as Record<string, unknown>;
  const costingBoq = (row.costing_boq ?? {}) as Record<string, unknown>;
  const workflow = (row.workflow ?? {}) as Record<string, unknown>;
  const documents = (row.documents ?? []) as unknown[];
  const dto: Record<string, unknown> = {
    id: row.id, templateCode: row.template_code, name: row.name, description: row.description,
    businessType: row.business_type, projectType: row.project_type, team: row.team, region: row.region,
    visibility: row.visibility, imageUrl: row.image_url, tags: row.tags ?? [], status: row.status,
    version: Number(row.current_version), useCount: Number(row.use_count), lastUsedAt: row.last_used_at,
    publishedAt: row.published_at, createdBy: row.created_by, updatedBy: row.updated_by,
    createdAt: row.created_at, updatedAt: row.updated_at,
    composition: {
      rooms: Array.isArray(structure.areas) ? structure.areas.length : Number(structure.roomCount ?? 0),
      boqSections: Array.isArray(costingBoq.sections) ? costingBoq.sections.length : Number(costingBoq.sectionCount ?? 0),
      items: Number(costingBoq.itemCount ?? 0),
      stages: Array.isArray(workflow.stages) ? workflow.stages.length : 0,
      tasks: Array.isArray(workflow.tasks) ? workflow.tasks.length : 0,
      milestones: Array.isArray(workflow.milestones) ? workflow.milestones.length : 0,
      approvals: Array.isArray(workflow.approvals) ? workflow.approvals.length : 0,
      rules: Array.isArray(workflow.rules) ? workflow.rules.length : 0,
      documents: documents.length,
    },
  };
  if (includeContent) Object.assign(dto, { structure, costingBoq, workflow, documents });
  return dto;
}

async function listProjectTemplates(request: NextRequest, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { page, pageSize, from, to } = pagination(request.nextUrl.searchParams);
  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 120);
  const status = request.nextUrl.searchParams.get("status");
  const type = request.nextUrl.searchParams.get("type")?.trim().slice(0, 80);
  let query = supabase.from("project_templates").select(projectTemplateSelect, { count: "exact" })
    .eq("workspace_id", scoped.access.workspaceId).is("archived_at", null).order("updated_at", { ascending: false }).range(from, to);
  if (status && ["draft", "active", "needs_review"].includes(status)) query = query.eq("status", status);
  if (type) query = query.eq("business_type", type);
  if (search) {
    const safe = search.replace(/[%_,()]/g, " ");
    query = query.or(`template_code.ilike.%${safe}%,name.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  const result = await query;
  if (result.error) return fail("INTERNAL_ERROR", "Project templates could not be loaded.", 500, id);
  const total = result.count ?? 0;
  return ok({ items: (result.data ?? []).map((row) => projectTemplateDto(row as Record<string, unknown>)), page, pageSize, total, hasMore: to + 1 < total }, 200, id);
}

async function projectTemplatesOverview(supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const result = await supabase.from("project_templates").select(projectTemplateSelect)
    .eq("workspace_id", scoped.access.workspaceId).is("archived_at", null).order("last_used_at", { ascending: false, nullsFirst: false });
  if (result.error) return fail("INTERNAL_ERROR", "Template overview could not be loaded.", 500, id);
  const rows = result.data ?? [];
  const byType = rows.reduce<Record<string, number>>((counts, row) => { counts[row.business_type] = (counts[row.business_type] ?? 0) + 1; return counts; }, {});
  return ok({ total: rows.length, active: rows.filter((row) => row.status === "active").length,
    draft: rows.filter((row) => row.status === "draft").length, needsReview: rows.filter((row) => row.status === "needs_review").length,
    byType, recentlyUsed: rows.filter((row) => row.last_used_at).slice(0, 8).map((row) => projectTemplateDto(row as Record<string, unknown>)) }, 200, id);
}

async function createProjectTemplate(request: Request, supabase: SupabaseClient, id: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, projectTemplateCreateSchema, id); if (input.response) return input.response;
  const value = input.data;
  const result = await supabase.from("project_templates").insert({ workspace_id: scoped.access.workspaceId,
    name: value.name, description: value.description ?? null, business_type: value.businessType, project_type: value.projectType,
    team: value.team ?? null, region: value.region ?? null, visibility: value.visibility, image_url: value.imageUrl ?? null,
    tags: value.tags, structure: value.structure, costing_boq: value.costingBoq, workflow: value.workflow, documents: value.documents,
    created_by: scoped.access.userId, updated_by: scoped.access.userId }).select(projectTemplateSelect).single();
  if (result.error) return fail("VALIDATION_ERROR", "Project template could not be created.", 400, id);
  await audit(supabase, "project_template.created", id);
  return ok(projectTemplateDto(result.data as Record<string, unknown>, true), 201, id);
}

async function getProjectTemplate(supabase: SupabaseClient, id: string, templateId: string) {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const result = await supabase.from("project_templates").select(projectTemplateSelect).eq("workspace_id", scoped.access.workspaceId)
    .eq("id", templateId).is("archived_at", null).single();
  return result.error ? fail("NOT_FOUND", "Project template was not found.", 404, id) : ok(projectTemplateDto(result.data as Record<string, unknown>, true), 200, id);
}

async function updateProjectTemplate(request: Request, supabase: SupabaseClient, id: string, templateId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, projectTemplatePatchSchema, id); if (input.response) return input.response;
  const value = input.data;
  const patch: Record<string, unknown> = { updated_by: scoped.access.userId };
  const keys: Record<string, string> = { name: "name", description: "description", businessType: "business_type", projectType: "project_type",
    team: "team", region: "region", visibility: "visibility", imageUrl: "image_url", tags: "tags", status: "status" };
  for (const [key, column] of Object.entries(keys)) if (key in value) patch[column] = value[key as keyof typeof value];
  const result = await supabase.from("project_templates").update(patch).eq("workspace_id", scoped.access.workspaceId).eq("id", templateId)
    .is("archived_at", null).select(projectTemplateSelect).single();
  if (result.error) return fail("NOT_FOUND", "Project template was not found or could not be updated.", 404, id);
  await audit(supabase, "project_template.updated", id);
  return ok(projectTemplateDto(result.data as Record<string, unknown>, true), 200, id);
}

async function projectTemplateSection(request: Request, supabase: SupabaseClient, id: string, templateId: string, section: string) {
  const column = section === "costing-boq" ? "costing_boq" : section;
  const scoped = await workspaceAccess(supabase, id, request.method === "PATCH"); if ("response" in scoped) return scoped.response;
  if (request.method === "GET") {
    const result = await supabase.from("project_templates").select(projectTemplateSelect).eq("workspace_id", scoped.access.workspaceId).eq("id", templateId).is("archived_at", null).single();
    if (result.error) return fail("NOT_FOUND", "Project template was not found.", 404, id);
    const data = result.data as unknown as Record<string, unknown>;
    return ok({ templateId, version: data.current_version, data: data[column] }, 200, id);
  }
  const input = await parsed(request, projectTemplateSectionSchema, id); if (input.response) return input.response;
  const result = await supabase.from("project_templates").update({ [column]: input.data.data, updated_by: scoped.access.userId })
    .eq("workspace_id", scoped.access.workspaceId).eq("id", templateId).is("archived_at", null).select(projectTemplateSelect).single();
  if (result.error) return fail("NOT_FOUND", "Project template was not found or could not be updated.", 404, id);
  await audit(supabase, `project_template.${section}.updated`, id);
  const data = result.data as unknown as Record<string, unknown>;
  return ok({ templateId, version: data.current_version, data: data[column] }, 200, id);
}

async function projectTemplateDocuments(request: Request, supabase: SupabaseClient, id: string, templateId: string) {
  const scoped = await workspaceAccess(supabase, id, request.method === "PATCH"); if ("response" in scoped) return scoped.response;
  if (request.method === "GET") {
    const result = await supabase.from("project_templates").select("documents,current_version").eq("workspace_id", scoped.access.workspaceId).eq("id", templateId).is("archived_at", null).single();
    return result.error ? fail("NOT_FOUND", "Project template was not found.", 404, id) : ok({ templateId, version: result.data.current_version, documents: result.data.documents }, 200, id);
  }
  const input = await parsed(request, projectTemplateDocumentsSchema, id); if (input.response) return input.response;
  const result = await supabase.from("project_templates").update({ documents: input.data.documents, updated_by: scoped.access.userId })
    .eq("workspace_id", scoped.access.workspaceId).eq("id", templateId).is("archived_at", null).select("documents,current_version").single();
  if (result.error) return fail("NOT_FOUND", "Project template was not found or could not be updated.", 404, id);
  await audit(supabase, "project_template.documents.updated", id);
  return ok({ templateId, version: result.data.current_version, documents: result.data.documents }, 200, id);
}

async function publishProjectTemplate(request: Request, supabase: SupabaseClient, id: string, templateId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, projectTemplatePublishSchema, id); if (input.response) return input.response;
  const current = await supabase.from("project_templates").select(projectTemplateSelect).eq("workspace_id", scoped.access.workspaceId).eq("id", templateId).is("archived_at", null).single();
  if (current.error) return fail("NOT_FOUND", "Project template was not found.", 404, id);
  const version = Number(current.data.current_version) + 1;
  const snapshot = { ...projectTemplateDto(current.data as Record<string, unknown>, true), version };
  const saved = await supabase.from("project_template_versions").insert({ workspace_id: scoped.access.workspaceId, template_id: templateId,
    version, snapshot, change_note: input.data.changeNote ?? null, created_by: scoped.access.userId });
  if (saved.error) return fail("CONFLICT", "Template version could not be published.", 409, id);
  const updated = await supabase.from("project_templates").update({ current_version: version, status: "active", published_at: new Date().toISOString(), updated_by: scoped.access.userId })
    .eq("workspace_id", scoped.access.workspaceId).eq("id", templateId).select(projectTemplateSelect).single();
  if (updated.error) return fail("INTERNAL_ERROR", "Template was versioned but could not be activated.", 500, id);
  await audit(supabase, "project_template.published", id);
  return ok(projectTemplateDto(updated.data as Record<string, unknown>, true), 200, id);
}

async function projectTemplateHistory(request: NextRequest, supabase: SupabaseClient, id: string, templateId: string, resource: "versions" | "usage") {
  const scoped = await workspaceAccess(supabase, id); if ("response" in scoped) return scoped.response;
  const { page, pageSize, from, to } = pagination(request.nextUrl.searchParams);
  const table = resource === "versions" ? "project_template_versions" : "project_template_usage";
  const select = resource === "versions" ? "id,version,change_note,created_by,created_at" : "id,template_version,project_id,used_by,created_at,projects(project_code,name,client_name,status,progress,updated_at)";
  const result = await supabase.from(table).select(select, { count: "exact" }).eq("workspace_id", scoped.access.workspaceId).eq("template_id", templateId)
    .order("created_at", { ascending: false }).range(from, to);
  if (result.error) return fail("INTERNAL_ERROR", `Template ${resource} could not be loaded.`, 500, id);
  const total = result.count ?? 0;
  return ok({ items: result.data ?? [], page, pageSize, total, hasMore: to + 1 < total }, 200, id);
}

async function useProjectTemplate(request: Request, supabase: SupabaseClient, id: string, templateId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const input = await parsed(request, projectTemplateUseSchema, id); if (input.response) return input.response;
  const result = await supabase.rpc("use_project_template", { p_workspace_id: scoped.access.workspaceId, p_template_id: templateId,
    p_name: input.data.projectName, p_client_name: input.data.clientName, p_location: input.data.location ?? null,
    p_start_date: input.data.startDate ?? null, p_target_completion_date: input.data.targetCompletionDate ?? null });
  if (result.error) return fail("CONFLICT", "Only an active template can be used to create a project.", 409, id);
  await audit(supabase, "project_template.used", id);
  return ok(result.data, 201, id);
}

async function duplicateProjectTemplate(supabase: SupabaseClient, id: string, templateId: string) {
  const scoped = await workspaceAccess(supabase, id, true); if ("response" in scoped) return scoped.response;
  const source = await supabase.from("project_templates").select(projectTemplateSelect).eq("workspace_id", scoped.access.workspaceId).eq("id", templateId).is("archived_at", null).single();
  if (source.error) return fail("NOT_FOUND", "Project template was not found.", 404, id);
  const row = source.data;
  const created = await supabase.from("project_templates").insert({ workspace_id: scoped.access.workspaceId, name: `${row.name} Copy`, description: row.description,
    business_type: row.business_type, project_type: row.project_type, team: row.team, region: row.region, visibility: row.visibility,
    image_url: row.image_url, tags: row.tags, structure: row.structure, costing_boq: row.costing_boq, workflow: row.workflow,
    documents: row.documents, status: "draft", created_by: scoped.access.userId, updated_by: scoped.access.userId }).select(projectTemplateSelect).single();
  if (created.error) return fail("VALIDATION_ERROR", "Project template could not be duplicated.", 400, id);
  await audit(supabase, "project_template.duplicated", id);
  return ok(projectTemplateDto(created.data as Record<string, unknown>, true), 201, id);
}

async function archiveProjectTemplate(supabase: SupabaseClient, id: string, templateId: string) {
  const scoped = await workspaceAccess(supabase, id, true, true); if ("response" in scoped) return scoped.response;
  const result = await supabase.from("project_templates").update({ status: "archived", archived_at: new Date().toISOString(), updated_by: scoped.access.userId })
    .eq("workspace_id", scoped.access.workspaceId).eq("id", templateId).is("archived_at", null).select("id").single();
  if (result.error) return fail("NOT_FOUND", "Project template was not found.", 404, id);
  await audit(supabase, "project_template.archived", id);
  return ok({ archived: true }, 200, id);
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
  if (request.method === "GET" && route === "project-templates/overview") return projectTemplatesOverview(supabase, id);
  if (request.method === "GET" && route === "project-templates") return listProjectTemplates(request, supabase, id);
  if (request.method === "POST" && route === "project-templates") return createProjectTemplate(request, supabase, id);
  const projectTemplateMatch = route.match(/^project-templates\/([0-9a-f-]{36})$/i);
  if (projectTemplateMatch && request.method === "GET") return getProjectTemplate(supabase, id, projectTemplateMatch[1]);
  if (projectTemplateMatch && request.method === "PATCH") return updateProjectTemplate(request, supabase, id, projectTemplateMatch[1]);
  if (projectTemplateMatch && request.method === "DELETE") return archiveProjectTemplate(supabase, id, projectTemplateMatch[1]);
  const projectTemplateSectionMatch = route.match(/^project-templates\/([0-9a-f-]{36})\/(structure|costing-boq|workflow)$/i);
  if (projectTemplateSectionMatch && ["GET", "PATCH"].includes(request.method)) return projectTemplateSection(request, supabase, id, projectTemplateSectionMatch[1], projectTemplateSectionMatch[2]);
  const projectTemplateDocumentsMatch = route.match(/^project-templates\/([0-9a-f-]{36})\/documents$/i);
  if (projectTemplateDocumentsMatch && ["GET", "PATCH"].includes(request.method)) return projectTemplateDocuments(request, supabase, id, projectTemplateDocumentsMatch[1]);
  const projectTemplateVersionsMatch = route.match(/^project-templates\/([0-9a-f-]{36})\/versions$/i);
  if (projectTemplateVersionsMatch && request.method === "GET") return projectTemplateHistory(request, supabase, id, projectTemplateVersionsMatch[1], "versions");
  const projectTemplateUsageMatch = route.match(/^project-templates\/([0-9a-f-]{36})\/usage$/i);
  if (projectTemplateUsageMatch && request.method === "GET") return projectTemplateHistory(request, supabase, id, projectTemplateUsageMatch[1], "usage");
  const projectTemplatePublishMatch = route.match(/^project-templates\/([0-9a-f-]{36})\/publish$/i);
  if (projectTemplatePublishMatch && request.method === "POST") return publishProjectTemplate(request, supabase, id, projectTemplatePublishMatch[1]);
  const projectTemplateUseMatch = route.match(/^project-templates\/([0-9a-f-]{36})\/use$/i);
  if (projectTemplateUseMatch && request.method === "POST") return useProjectTemplate(request, supabase, id, projectTemplateUseMatch[1]);
  const projectTemplateDuplicateMatch = route.match(/^project-templates\/([0-9a-f-]{36})\/duplicate$/i);
  if (projectTemplateDuplicateMatch && request.method === "POST") return duplicateProjectTemplate(supabase, id, projectTemplateDuplicateMatch[1]);
  if (request.method === "GET" && route === "projects") return listProjects(request, supabase, id);
  if (request.method === "POST" && route === "projects") return createProject(request, supabase, id);
  if (request.method === "GET" && route === "projects/import-template") return projectImportTemplate(supabase, id);
  if (request.method === "GET" && route === "projects/export") return projectExport(supabase, id);
  if (request.method === "GET" && route === "projects/imports") return projectImportHistory(request, supabase, id);
  if (request.method === "POST" && route === "projects/imports/preview") return previewProjectImport(request, supabase, id);
  if (request.method === "POST" && route === "projects/imports") return importProjects(request, supabase, id);
  const projectMatch = route.match(/^projects\/([0-9a-f-]{36})$/i);
  if (projectMatch && request.method === "GET") return getProject(supabase, id, projectMatch[1]);
  if (projectMatch && request.method === "PATCH") return updateProject(request, supabase, id, projectMatch[1]);
  if (projectMatch && request.method === "DELETE") return deleteProject(supabase, id, projectMatch[1]);
  const projectStatusMatch = route.match(/^projects\/([0-9a-f-]{36})\/status$/i);
  if (projectStatusMatch && request.method === "POST") return changeProjectStatus(request, supabase, id, projectStatusMatch[1]);
  const projectDuplicateMatch = route.match(/^projects\/([0-9a-f-]{36})\/duplicate$/i);
  if (projectDuplicateMatch && request.method === "POST") return duplicateProject(supabase, id, projectDuplicateMatch[1]);
  const projectRoomsMatch = route.match(/^projects\/([0-9a-f-]{36})\/rooms$/i);
  if (projectRoomsMatch && request.method === "GET") return listProjectRooms(supabase, id, projectRoomsMatch[1]);
  if (projectRoomsMatch && request.method === "POST") return createProjectRoom(request, supabase, id, projectRoomsMatch[1]);
  const projectRoomMatch = route.match(/^projects\/([0-9a-f-]{36})\/rooms\/([0-9a-f-]{36})$/i);
  if (projectRoomMatch && request.method === "PATCH") return updateProjectRoom(request, supabase, id, projectRoomMatch[1], projectRoomMatch[2]);
  if (projectRoomMatch && request.method === "DELETE") return deleteProjectRoom(supabase, id, projectRoomMatch[1], projectRoomMatch[2]);
  if (request.method === "POST" && route === "boq-imports/preview") return previewBoqImport(request, supabase, id);
  if (request.method === "POST" && route === "boq-imports/upload") return uploadBoqImport(request, supabase, id);
  if (request.method === "POST" && route === "boq-imports") return createBoqImport(request, supabase, id);
  if (request.method === "GET" && route === "boqs") return listBoqs(request, supabase, id);
  if (request.method === "POST" && route === "boqs") return createBoq(request, supabase, id);
  if (["GET","POST"].includes(request.method) && route === "boq-templates") return boqTemplates(request, supabase, id);
  const boqMatch = route.match(/^boqs\/([0-9a-f-]{36})$/i);
  if (boqMatch && request.method === "GET") return getBoq(supabase, id, boqMatch[1]);
  if (boqMatch && request.method === "PATCH") return updateBoq(request, supabase, id, boqMatch[1]);
  const boqStatusMatch = route.match(/^boqs\/([0-9a-f-]{36})\/status$/i);
  if (boqStatusMatch && request.method === "POST") return setBoqStatus(request, supabase, id, boqStatusMatch[1]);
  const boqDuplicateMatch = route.match(/^boqs\/([0-9a-f-]{36})\/duplicate$/i);
  if (boqDuplicateMatch && request.method === "POST") return duplicateBoq(supabase, id, boqDuplicateMatch[1]);
  const boqRoomsMatch = route.match(/^boqs\/([0-9a-f-]{36})\/rooms$/i);
  if (boqRoomsMatch && request.method === "POST") return boqChild(request, supabase, id, boqRoomsMatch[1], "room");
  const boqRoomMatch = route.match(/^boqs\/([0-9a-f-]{36})\/rooms\/([0-9a-f-]{36})$/i);
  if (boqRoomMatch && ["PATCH","DELETE"].includes(request.method)) return boqChild(request, supabase, id, boqRoomMatch[1], "room", undefined, boqRoomMatch[2]);
  const boqCategoriesMatch = route.match(/^boqs\/([0-9a-f-]{36})\/rooms\/([0-9a-f-]{36})\/categories$/i);
  if (boqCategoriesMatch && request.method === "POST") return boqChild(request, supabase, id, boqCategoriesMatch[1], "category", boqCategoriesMatch[2]);
  const boqCategoryMatch = route.match(/^boqs\/([0-9a-f-]{36})\/categories\/([0-9a-f-]{36})$/i);
  if (boqCategoryMatch && ["PATCH","DELETE"].includes(request.method)) return boqChild(request, supabase, id, boqCategoryMatch[1], "category", undefined, boqCategoryMatch[2]);
  const boqItemsMatch = route.match(/^boqs\/([0-9a-f-]{36})\/categories\/([0-9a-f-]{36})\/items$/i);
  if (boqItemsMatch && request.method === "POST") return boqChild(request, supabase, id, boqItemsMatch[1], "item", boqItemsMatch[2]);
  const boqItemMatch = route.match(/^boqs\/([0-9a-f-]{36})\/items\/([0-9a-f-]{36})$/i);
  if (boqItemMatch && ["PATCH","DELETE"].includes(request.method)) return boqChild(request, supabase, id, boqItemMatch[1], "item", undefined, boqItemMatch[2]);
  if (request.method === "GET" && route === "costing/categories") return costingCategories(request, supabase, id);
  if (request.method === "POST" && route === "costing/categories") return createCostingCategory(request, supabase, id);
  const costingCategoryMatch = route.match(/^costing\/categories\/([0-9a-f-]{36})$/i);
  if (costingCategoryMatch && ["GET","PATCH","DELETE"].includes(request.method)) return costingCategoryDetail(request, supabase, id, costingCategoryMatch[1]);
  if (request.method === "GET" && route === "costing/items") return costingItems(request, supabase, id);
  if (request.method === "POST" && route === "costing/items") return createCostingItem(request, supabase, id);
  const costingItemMatch = route.match(/^costing\/items\/([0-9a-f-]{36})$/i);
  if (costingItemMatch && ["GET","PATCH","DELETE"].includes(request.method)) return costingItemDetail(request, supabase, id, costingItemMatch[1]);
  if (request.method === "POST" && route === "costing/vendor-quotes") return addVendorQuote(request, supabase, id);
  const vendorSelectMatch = route.match(/^costing\/vendor-quotes\/([0-9a-f-]{36})\/selection$/i);
  if (vendorSelectMatch && request.method === "POST") return selectVendorQuote(request, supabase, id, vendorSelectMatch[1]);
  if (request.method === "GET" && route === "costing/scenarios") return costingScenarios(request, supabase, id);
  if (request.method === "POST" && route === "costing/scenarios") return createCostingScenario(request, supabase, id);
  const scenarioMatch = route.match(/^costing\/scenarios\/([0-9a-f-]{36})$/i);
  if (scenarioMatch && ["GET","PATCH"].includes(request.method)) return costingScenarioDetail(request, supabase, id, scenarioMatch[1]);
  const scenarioDuplicateMatch = route.match(/^costing\/scenarios\/([0-9a-f-]{36})\/duplicate$/i);
  if (scenarioDuplicateMatch && request.method === "POST") return costingScenarioDetail(request, supabase, id, scenarioDuplicateMatch[1], true);
  if (request.method === "GET" && route === "costing/analysis") return costingAnalysis(supabase, id);
  if (request.method === "GET" && route === "costing/margins") return marginAnalysis(supabase, id);
  if (request.method === "GET" && route === "costing/settings") return costingSettings(supabase, id);
  if (request.method === "GET" && route === "reports/analytics") return reportsAnalytics(request, supabase, id);
  if (request.method === "GET" && route === "reports/analytics/pdf") return reportsPdf(request, supabase, id);
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
