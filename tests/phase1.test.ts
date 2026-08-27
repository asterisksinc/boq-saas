import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { emptyPage, pagination } from "../lib/domain/dashboard";
import { permissionsFor } from "../lib/domain/permissions";
import { consumeRateLimit } from "../lib/api/rate-limit";
import { onboardingPatchSchema, registerSchema, userPatchSchema } from "../lib/api/validation";

describe("Phase 1 request contracts", () => {
  it("normalizes registration email and rejects unknown fields", () => {
    expect(registerSchema.parse({ email: "  OWNER@Example.COM ", password: "a-secure-password" }).email).toBe("owner@example.com");
    expect(() => registerSchema.parse({ email: "a@b.com", password: "a-secure-password", role: "owner" })).toThrow();
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
});
