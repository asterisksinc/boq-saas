import { type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EmailOtpError, issueEmailOtp, verifyEmailOtp } from "@/lib/auth/email-otp";
import { emptyPage, pagination } from "@/lib/domain/dashboard";
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

async function dashboardOverview(supabase: SupabaseClient, id: string) {
  const auth = await requireUser(supabase, id); if (auth.response) return auth.response;
  const { data, error } = await supabase.rpc("get_dashboard_overview");
  if (error) {
    console.error(JSON.stringify({ requestId: id, event: "dashboard_overview_failed", code: error.code }));
    return fail("INTERNAL_ERROR", "Dashboard overview is temporarily unavailable.", 500, id);
  }
  return ok(data, 200, id);
}

async function dashboardList(request: NextRequest, supabase: SupabaseClient, id: string, name: string) {
  const ctx = await context(supabase, id); if ("response" in ctx) return ctx.response;
  const workspaceId = (ctx.data as { workspace?: { id?: string } } | null)?.workspace?.id;
  if (!workspaceId) return fail("FORBIDDEN", "Active workspace membership required.", 403, id);
  const { page, pageSize, from, to } = pagination(request.nextUrl.searchParams);
  if (name !== "notifications") return ok(emptyPage(page, pageSize), 200, id);
  const countQuery = supabase.from("notifications").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId);
  const itemsQuery = supabase.from("notifications").select("id,type,title,priority,target_type,target_id,read_at,created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).range(from, to);
  const [count, items] = await Promise.all([countQuery, itemsQuery]);
  if (count.error || items.error) return fail("INTERNAL_ERROR", "Notifications could not be loaded.", 500, id);
  const total = count.count ?? 0;
  return ok({ items: items.data ?? [], page, pageSize, total, hasMore: to + 1 < total }, 200, id);
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
  if (request.method === "GET" && route === "dashboard/overview") return dashboardOverview(supabase, id);
  const list = route.match(/^dashboard\/(recent-projects|recent-boqs|pending-actions|upcoming-deliverables|notifications)$/)?.[1];
  if (request.method === "GET" && list) return dashboardList(request, supabase, id, list);
  return methodNotAllowed(id);
}

export async function GET(request: NextRequest, params: Params) { return dispatch(request, (await params.params).path); }
export async function POST(request: NextRequest, params: Params) { return dispatch(request, (await params.params).path); }
export async function PATCH(request: NextRequest, params: Params) { return dispatch(request, (await params.params).path); }
