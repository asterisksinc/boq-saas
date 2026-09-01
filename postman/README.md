# BOQ Design Arena Postman guide

## Import

1. Configure `SUPABASE_SECRET_KEY`, `AUTH_OTP_SECRET`, `GMAIL_SMTP_USER`, and `GMAIL_SMTP_APP_PASSWORD` in `.env.local`, apply `20260830213500_custom_email_login_otps.sql`, then start the app with `npm run dev`.
2. In Postman, select **Import** and import both files:
   - `BOQ-Design-Arena-Phase-1.postman_collection.json`
   - `BOQ-Design-Arena-Local.postman_environment.json`
   - For authentication testing only, import `BOQ-Design-Arena-Auth-Only.postman_collection.json` instead of the full collection.
3. Select **BOQ Design Arena — Local** from the environment selector.
4. Replace `email`, `password`, `displayName`, and `companyName`. Leave `otp` blank until Gmail delivers the six-digit code.
5. Confirm Postman's cookie jar is enabled. Do not create a Bearer token variable: this API uses Supabase SSR cookies.

## Recommended run order

1. For a new account, run **Register**, copy the Gmail code into `otp`, then run **Verify Registration OTP**.
2. Run **Request Login OTP**, replace `otp` with the new Gmail code, and run **Verify Login OTP**. Existing accounts can start here.
3. Postman stores the login response's Supabase cookies for `localhost`.
4. Run **Auth Me** and **Get Current User**.

## Proposals and Documents

Import `BOQ-Design-Arena-Proposals-Documents.postman_collection.json` after the
Local environment. Authenticate with either existing collection first and keep
Postman's cookie jar enabled. Run **Create Folder** before document requests,
select a local allowlisted file in **Upload Document**, and run destructive
requests last. The collection stores created proposal/folder/document UUIDs as
collection variables automatically.
5. Run **Save Company Setup**, then **Get Onboarding**.
6. Run **Overview** and the five dashboard list requests.
7. Run **Logout**.

For password recovery, run **Forgot Password**, open the email, copy the redirect's `code` into `resetCode`, and run **Reset Password**.

## Cookies and common failures

- `401 UNAUTHENTICATED`: run Login again and check Postman → Cookies → `localhost` for an `sb-...-auth-token` cookie.
- `500 Backend is not configured`: fill all Supabase/Gmail/OTP server variables, apply the OTP migration, and restart Next.js.
- `500 OTP_SEND_FAILED`: confirm the Gmail address matches the account that issued the App Password and inspect the server log reason.
- `401 Invalid or expired OTP`: request a new code; codes expire after 10 minutes and are removed after five failed attempts.
- `400 Reset link is invalid`: recovery codes are one-time and expire. Run Forgot Password again.
- `429 RATE_LIMITED`: respect the 60-second resend cooldown or API abuse limit; do not retry in a loop.
- A protected request immediately after Logout should return `401`; Postman may retain stale cookies in its cookie manager, so delete the `localhost` cookies if necessary.

## Production environment

Duplicate the local Postman environment and change only `baseUrl` to the deployed application origin, for example `https://app.example.com`. Never put a Supabase service-role key in Postman or frontend variables.
