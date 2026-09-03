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
