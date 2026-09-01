# BOQ Design Arena Postman guide

## Import

Import only these two files:

1. `BOQ-Design-Arena-Complete.postman_collection.json`
2. `BOQ-Design-Arena-Local.postman_environment.json`

Select the Local environment and keep Postman's cookie jar enabled. The API
uses Supabase SSR cookies; do not create or store a bearer-token variable.

Before running the collection, configure the application `.env.local`, apply
all Supabase migrations in timestamp order, and start the app with
`npm run dev`.

## Run order

Run the collection folders in numeric order:

1. Authentication
2. Current User
3. Onboarding
4. Dashboard
5. Negative Security Checks
6. Proposals
7. Document Folders
8. Documents
9. Proposal & Document Negative Checks
10. Invoices

For OTP requests, copy the six-digit Gmail code into the environment `otp`
value before running the corresponding verification request. For document
upload, choose a local allowlisted file in the Postman file field. Run delete
and archive requests last.

The collection automatically stores created proposal, folder, document, and
invoice IDs as collection variables.

Folder 11 in the Complete collection covers project CRUD, lifecycle,
duplication, room setup, and backend Excel/CSV import. Set the `projectFile`
collection variable (or choose a file in each request) before running
preview/import.

## Common failures

- `401 UNAUTHENTICATED`: sign in again and check Postman's `localhost` cookie jar.
- `500 Backend is not configured`: configure Supabase/Gmail/OTP variables and restart Next.js.
- `500 OTP_SEND_FAILED`: verify the Gmail App Password and server logs.
- `401 Invalid or expired OTP`: request a new code; codes expire after 10 minutes.
- `400 Reset link is invalid`: request another one-time recovery link.
- `429 RATE_LIMITED`: wait for the cooldown instead of retrying in a loop.

For production, duplicate the Local environment and change only `baseUrl` to
the deployed HTTPS application origin. Never place the Supabase service-role
key in Postman.
