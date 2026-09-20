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
11. Projects & Excel Import
12. BOQ Management
13. Costing
14. Reports & Analytics
15. Project Templates (User)
16. Billing & Settings (User)
17. Activities (User)
18. Help & Support (User)

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

Folders 12-14 cover the new User APIs. Run folder 12 after Create Project so
`projectId` is populated; it automatically stores the generated BOQ ID plus the
BOQ room/category/item IDs used by later requests. BOQ number and version are
server-generated, so the create request intentionally sends only the selected
project and commercial defaults. Folder 13 builds a costing category/item, adds
and selects a vendor quote, then creates a scenario and loads cost/margin
analysis. Folder 14 requires an owner/admin session because business-wide
revenue, cost, margin, team, and client analytics are financially sensitive.

Folder 15 covers the authenticated project-template flow. Run Create Project
Template first so `projectTemplateId` is captured, replace the designer
sections, publish the template, and only then run Use Template. Workspace
`owner`, `admin`, and `member` roles can run those writes; `viewer` can run the
GET requests only. Archive is restricted to `owner` and `admin`.

Folders 16-18 cover Billing/Settings, Activities, and Help/Support. The seeded
`demo@boq.com` member can run all reads plus activity and support writes.
Billing and organization-setting mutations require an owner/admin session and
will correctly return `403` for the demo member. Billing uses internal provider
mode and never accepts raw card numbers.

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
