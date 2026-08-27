# BOQ Design Arena Postman guide

## Import

1. Start the app with `npm run dev`.
2. In Postman, select **Import** and import both files:
   - `BOQ-Design-Arena-Phase-1.postman_collection.json`
   - `BOQ-Design-Arena-Local.postman_environment.json`
3. Select **BOQ Design Arena — Local** from the environment selector.
4. Replace `email`, `password`, `displayName`, and `companyName`. Use a unique email for registration.
5. Confirm Postman's cookie jar is enabled. Do not create a Bearer token variable: this API uses Supabase SSR cookies.

## Recommended run order

1. **Register**.
2. If email confirmation is enabled in Supabase, open the verification email:
   - If the redirect contains `?code=...`, copy it to `verificationCode` and run **Verify Email — PKCE Code**.
   - For a custom token-hash template, set `verificationTokenHash` and run **Verify Email — Token Hash**.
3. **Login**. Postman stores the returned Supabase cookies for `localhost`.
4. **Auth Me** and **Get Current User**.
5. **Save Company Setup**, then **Get Onboarding**.
6. **Overview** and the five dashboard list requests.
7. **Logout**.

For password recovery, run **Forgot Password**, open the email, copy the redirect's `code` into `resetCode`, and run **Reset Password**.

## Cookies and common failures

- `401 UNAUTHENTICATED`: run Login again and check Postman → Cookies → `localhost` for an `sb-...-auth-token` cookie.
- `500 Backend is not configured`: create `.env.local` with the Supabase URL and publishable key, then restart Next.js.
- Registration succeeds but login fails: email confirmation is probably enabled; verify the email first.
- `400 Reset link is invalid`: recovery codes are one-time and expire. Run Forgot Password again.
- `429 RATE_LIMITED`: wait for the 15-minute in-process window or restart the local development server. Production Supabase rate limits must also be configured.
- A protected request immediately after Logout should return `401`; Postman may retain stale cookies in its cookie manager, so delete the `localhost` cookies if necessary.

## Production environment

Duplicate the local Postman environment and change only `baseUrl` to the deployed application origin, for example `https://app.example.com`. Never put a Supabase service-role key in Postman or frontend variables.

