import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { emptyPage, pagination } from "../lib/domain/dashboard";
import { permissionsFor } from "../lib/domain/permissions";
import { consumeRateLimit } from "../lib/api/rate-limit";
import { loginSchema, onboardingPatchSchema, registerSchema, userPatchSchema } from "../lib/api/validation";

describe("Phase 1 request contracts", () => {
  it("normalizes registration email and rejects unknown fields", () => {
    expect(registerSchema.parse({ email: "  OWNER@Example.COM ", password: "a-secure-password" }).email).toBe("owner@example.com");
    expect(() => registerSchema.parse({ email: "a@b.com", password: "a-secure-password", role: "owner" })).toThrow();
  });

  it("accepts OTP request and verification login payloads", () => {
    expect(loginSchema.parse({ email: " USER@Example.com " })).toEqual({ email: "user@example.com" });
    expect(loginSchema.parse({ email: "user@example.com", otp: "123456" })).toEqual({ email: "user@example.com", otp: "123456" });
    expect(() => loginSchema.parse({ email: "user@example.com", otp: "12345" })).toThrow();
  });

  it("rejects profile mass assignment", () => {
    expect(() => userPatchSchema.parse({ displayName: "User", userId: "other", workspaceId: "other" })).toThrow();
  });

  it("validates source-backed company settings", () => {
    expect(onboardingPatchSchema.parse({ company: { name: "Studio", currency: "INR", timezone: "Asia/Kolkata" } })).toBeTruthy();
    expect(() => onboardingPatchSchema.parse({ company: { currency: "rupees" } })).toThrow();
  });
});

describe("permissions and empty dashboard contracts", () => {
  it("does not expose financial capability to member/viewer roles", () => {
    expect(permissionsFor("member").canViewFinancials).toBe(false);
    expect(permissionsFor("viewer").canViewFinancials).toBe(false);
    expect(permissionsFor("owner").canViewFinancials).toBe(true);
  });

  it("bounds pagination and returns a stable empty page", () => {
    const result = pagination(new URLSearchParams("page=2&pageSize=1000"));
    expect(result).toEqual({ page: 2, pageSize: 100, from: 100, to: 199 });
    expect(emptyPage(result.page, result.pageSize)).toEqual({ items: [], page: 2, pageSize: 100, total: 0, hasMore: false });
  });

  it("rate limits repeated sensitive actions", () => {
    expect(consumeRateLimit("test-login", 2, 1000, 0).allowed).toBe(true);
    expect(consumeRateLimit("test-login", 2, 1000, 0).allowed).toBe(true);
    expect(consumeRateLimit("test-login", 2, 1000, 0).allowed).toBe(false);
  });
});

describe("Supabase tenant controls", () => {
  const migration = readFileSync("supabase/migrations/20260827173000_phase1_auth_user_dashboard.sql", "utf8");
  const seed = readFileSync("supabase/seed.sql", "utf8");

  it("enables RLS for every exposed Phase 1 table", () => {
    for (const table of ["workspaces", "workspace_memberships", "user_profiles", "user_preferences", "workspace_profiles", "onboarding_progress", "notifications", "audit_logs"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("derives workspace scope from auth.uid and protects financial capability", () => {
    expect(migration).toContain("m.user_id = (select auth.uid())");
    expect(migration).toContain("'canViewFinancials', p_role in ('owner','admin')");
    expect(migration).toContain("case when s.role in ('owner','admin')");
  });

  it("seeds the requested confirmed email identity for OTP login testing", () => {
    expect(seed).toContain("diptishgohane04@gmail.com");
    expect(seed).toContain("insert into auth.identities");
    expect(seed).toContain('"email_verified":true');
    expect(seed).toContain('"provider":"email","providers":["email"]');
  });
});

describe("Supabase email OTP templates", () => {
  const authRoute = readFileSync("app/api/v1/[...path]/route.ts", "utf8");
  const customOtp = readFileSync("lib/auth/email-otp.ts", "utf8");
  const otpMigration = readFileSync("supabase/migrations/20260830213500_custom_email_login_otps.sql", "utf8");
  const config = readFileSync("supabase/config.toml", "utf8");
  const confirmation = readFileSync("supabase/templates/confirmation.html", "utf8");
  const login = readFileSync("supabase/templates/magic-link.html", "utf8");

  it("uses six-digit token templates instead of confirmation links", () => {
    for (const template of [confirmation, login]) {
      expect(template).toContain("{{ .Token }}");
      expect(template).not.toContain("{{ .ConfirmationURL }}");
    }
  });

  it("connects signup confirmation and login emails to their OTP templates", () => {
    expect(config).toContain("[auth.email.template.confirmation]");
    expect(config).toContain('content_path = "./supabase/templates/confirmation.html"');
    expect(config).toContain("[auth.email.template.magic_link]");
    expect(config).toContain('content_path = "./supabase/templates/magic-link.html"');
    expect(config).toContain("otp_length = 6");
  });

  it("uses a custom Gmail OTP instead of Supabase email delivery", () => {
    expect(customOtp).toContain("nodemailer.createTransport");
    expect(customOtp).toContain("randomInt(100000, 1000000)");
    expect(customOtp).toContain('service: "gmail"');
    expect(authRoute).not.toContain("signInWithOtp");
  });

  it("stores only hashed, expiring OTPs behind service-role access", () => {
    expect(customOtp).toContain('createHmac("sha256"');
    expect(otpMigration).toContain("alter table public.email_login_otps enable row level security");
    expect(otpMigration).toContain("revoke all on public.email_login_otps from anon, authenticated");
    expect(otpMigration).toContain("expires_at timestamptz not null");
  });
});
