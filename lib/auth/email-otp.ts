import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const OTP_TTL_MS = 10 * 60_000;
const OTP_RESEND_MS = 60_000;
const OTP_MAX_ATTEMPTS = 5;

export type EmailOtpErrorCode = "RATE_LIMITED" | "INVALID_OTP" | "INTERNAL_ERROR";

export class EmailOtpError extends Error {
  constructor(public code: EmailOtpErrorCode, message: string) {
    super(message);
  }
}

function required(name: "AUTH_OTP_SECRET" | "GMAIL_SMTP_USER" | "GMAIL_SMTP_APP_PASSWORD") {
  const value = process.env[name]?.trim();
  if (!value) throw new EmailOtpError("INTERNAL_ERROR", `Missing ${name}`);
  return value;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashOtp(email: string, otp: string) {
  return createHmac("sha256", required("AUTH_OTP_SECRET"))
    .update(`${normalizeEmail(email)}:${otp}`)
    .digest("hex");
}

async function findOrCreateUser(email: string) {
  const admin = createSupabaseAdminClient();
  const { data: existing, error: findError } = await admin.rpc("find_auth_user_id_by_email", { p_email: email });
  if (findError) throw new EmailOtpError("INTERNAL_ERROR", "Unable to look up the authentication user.");
  if (typeof existing === "string" && existing) return existing;

  const password = randomBytes(48).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: false });
  if (error || !data.user) throw new EmailOtpError("INTERNAL_ERROR", "Unable to create the authentication user.");
  return data.user.id;
}

async function sendGmailOtp(email: string, otp: string) {
  const user = required("GMAIL_SMTP_USER");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: required("GMAIL_SMTP_APP_PASSWORD") },
  });

  await transporter.sendMail({
    from: `"BOQ Design Arena" <${user}>`,
    to: email,
    subject: `${otp} is your BOQ Design Arena login code`,
    text: `Your BOQ Design Arena login code is ${otp}. It expires in 10 minutes.`,
    html: `<h2>Your login code</h2><p>Enter this one-time code to sign in:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code expires in 10 minutes.</p>`,
  });
}

export async function issueEmailOtp(emailInput: string, knownUserId?: string) {
  const email = normalizeEmail(emailInput);
  const admin = createSupabaseAdminClient();
  const { data: previous, error: readError } = await admin
    .from("email_login_otps")
    .select("last_sent_at")
    .eq("email", email)
    .maybeSingle();
  if (readError) throw new EmailOtpError("INTERNAL_ERROR", "Unable to access the OTP store.");
  if (previous && Date.now() - new Date(previous.last_sent_at).getTime() < OTP_RESEND_MS) {
    throw new EmailOtpError("RATE_LIMITED", "Please wait before requesting another OTP.");
  }

  const userId = knownUserId ?? await findOrCreateUser(email);
  const otp = randomInt(100000, 1000000).toString();
  const now = new Date();
  const { error: writeError } = await admin.from("email_login_otps").upsert({
    email,
    user_id: userId,
    code_hash: hashOtp(email, otp),
    expires_at: new Date(now.getTime() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    last_sent_at: now.toISOString(),
  });
  if (writeError) throw new EmailOtpError("INTERNAL_ERROR", "Unable to save the OTP.");

  try {
    await sendGmailOtp(email, otp);
  } catch {
    await admin.from("email_login_otps").delete().eq("email", email);
    throw new EmailOtpError("INTERNAL_ERROR", "Gmail SMTP could not send the OTP.");
  }
}

export async function verifyEmailOtp(emailInput: string, otp: string) {
  const email = normalizeEmail(emailInput);
  const admin = createSupabaseAdminClient();
  const { data: record, error } = await admin
    .from("email_login_otps")
    .select("user_id,code_hash,expires_at,attempts")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new EmailOtpError("INTERNAL_ERROR", "Unable to access the OTP store.");
  if (!record || new Date(record.expires_at).getTime() <= Date.now() || record.attempts >= OTP_MAX_ATTEMPTS) {
    if (record) await admin.from("email_login_otps").delete().eq("email", email);
    throw new EmailOtpError("INVALID_OTP", "Invalid or expired OTP.");
  }

  const expected = Buffer.from(record.code_hash, "hex");
  const received = Buffer.from(hashOtp(email, otp), "hex");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    await admin.from("email_login_otps").update({ attempts: record.attempts + 1 }).eq("email", email);
    throw new EmailOtpError("INVALID_OTP", "Invalid or expired OTP.");
  }

  await admin.from("email_login_otps").delete().eq("email", email);
  return record.user_id as string;
}
