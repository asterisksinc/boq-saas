export function isEmailOtpBypassed(
  email: string,
  configuredEmails = process.env.OTP_BYPASS_EMAILS,
) {
  if (!configuredEmails) return false;

  const normalizedEmail = email.trim().toLowerCase();
  return configuredEmails
    .split(",")
    .map((candidate) => candidate.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalizedEmail);
}

/** Seeded/QA users can opt out through Supabase Auth app metadata. */
export function isOtpBypassedUser(
  _email: string,
  appMetadata?: Record<string, unknown> | null,
) {
  // The source of truth is Supabase Auth app_metadata. This keeps OTP bypass
  // scoped to explicitly seeded/QA users and avoids an email-based production
  // bypass controlled by the web server environment.
  return appMetadata?.otp_bypass === true;
}
