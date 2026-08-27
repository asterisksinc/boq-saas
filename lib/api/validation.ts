import { z } from "zod";

const email = z.string().trim().email().transform((value) => value.toLowerCase());
const password = z.string().min(10).max(128);

export const registerSchema = z.object({
  email,
  password,
  displayName: z.string().trim().min(1).max(120).optional(),
  companyName: z.string().trim().min(1).max(160).optional(),
}).strict();

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const forgotPasswordSchema = z.object({ email }).strict();
export const resetPasswordSchema = z.object({ code: z.string().min(1), password }).strict();
export const verifyEmailSchema = z.object({
  tokenHash: z.string().min(1),
  type: z.enum(["email", "signup", "email_change"]),
}).strict();
export const resendVerificationSchema = z.object({ email }).strict();
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: password }).strict();
export const userPatchSchema = z.object({ displayName: z.string().trim().min(1).max(120).nullable().optional() }).strict();
export const preferencesPatchSchema = z.object({
  timezone: z.string().trim().min(1).max(80).optional(),
  locale: z.string().trim().min(2).max(20).optional(),
}).strict();
export const onboardingPatchSchema = z.object({
  currentStep: z.string().trim().min(1).max(80).optional(),
  completedSteps: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  skippedSteps: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  company: z.object({
    name: z.string().trim().min(1).max(160).optional(),
    logoUrl: z.string().url().max(2048).nullable().optional(),
    website: z.string().url().max(2048).nullable().optional(),
    businessEmail: z.string().email().nullable().optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    country: z.string().trim().max(80).nullable().optional(),
    currency: z.string().trim().regex(/^[A-Z]{3}$/).optional(),
    taxId: z.string().trim().max(80).nullable().optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
  }).strict().optional(),
}).strict();

export function fieldErrors(error: z.ZodError) {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "body";
    (result[key] ??= []).push(issue.message);
  }
  return result;
}
