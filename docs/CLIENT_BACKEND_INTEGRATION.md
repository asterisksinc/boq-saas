# Client portal backend integration guide

This backend is scoped to users whose Supabase `app_metadata.role` or `user_metadata.role` is `client`. Existing non-client APIs and UI files were not changed. All client APIs are under `/api/v1/client/*` and use the existing cookie session or `Authorization: Bearer <access_token>`.

## Demo accounts

The optional seed file is `supabase/client_portal_seed.sql`.

| Email | Password | Project |
|---|---|---|
| `client.arjun@example.test` | `Client#2026A!` | `PRJ-DEMO-001` |
| `client.priya@example.test` | `Client#2026B!` | `PRJ-DEMO-002` |
| `client.rohan@example.test` | `Client#2026C!` | `PRJ-DEMO-003` |

Use the existing `POST /api/v1/auth/login` flow to establish the session. In environments with email OTP enabled, complete the OTP step as normal.

## Frontend module mapping

Use the APIs below as the data source for the Figma screens. Keep the selected `projectId` in client portal state; pass it to every list request so the dashboard and module screens stay project-scoped.

| UI module | API | Use |
|---|---|---|
| Dashboard | `GET /api/v1/client/dashboard?projectId=` | Project header, BOQ/invoice/document summaries, manager details |
| Project switcher | `GET /api/v1/client/projects` | Available client-linked projects |
| BOQ list/detail | `GET /api/v1/client/boqs`, `GET /api/v1/client/boqs/:id` | Table, totals, version, room/category/item hierarchy |
| BOQ approval | `POST /api/v1/client/boqs/:id/decision` | Approve or request minor/major revision/reject; send the detail `version` to prevent stale approvals |
| Proposals | `GET /api/v1/client/proposals`, `GET /api/v1/client/proposals/:id` | Proposal cards/detail and PDF link |
| Proposal decision | `POST /api/v1/client/proposals/:id/decision` | Body `{ decision: "approved" | "revisions" | "rejected", comment? }` |
| Invoices | `GET /api/v1/client/invoices` | Invoice table plus `{ summary }` totals |
| Invoice detail | `GET /api/v1/client/invoices/:id` | Line items, outstanding amount, bank details, payment history |
| Pay / transaction proof | `POST /api/v1/client/invoices/:id/pay` | Records a client payment transaction; supports `method`, `reference`, `notes`, and retry-safe `idempotencyKey` |
| Documents | `GET /api/v1/client/documents` | Project files and proposal/contract signature state |
| Document signing | `POST /api/v1/client/projects/:projectId/documents/:documentId/sign` | Body includes `signerName`, `consent`, and optional signature data |
| Approvals screen | `GET /api/v1/client/approvals` | Combined BOQ, proposal, and activity approval feed |

## Request examples

```ts
const headers = {
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
};

const dashboard = await fetch(`/api/v1/client/dashboard?projectId=${projectId}`, { headers });
const boqs = await fetch(`/api/v1/client/boqs?projectId=${projectId}&page=1&pageSize=20`, { headers });

await fetch(`/api/v1/client/boqs/${boqId}/decision`, {
  method: "POST",
  headers,
  body: JSON.stringify({ action: "APPROVE", version: boq.version, confirmation: true }),
});

await fetch(`/api/v1/client/invoices/${invoiceId}/pay`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    amount: invoice.outstanding,
    method: "bank_transfer",
    reference: "UTR-12345",
    idempotencyKey: crypto.randomUUID(),
  }),
});
```

Successful responses use the existing API envelope (`data`, `requestId`). On error, handle `401` by refreshing/re-authenticating, `403` as an access/role problem, `404` as a stale project/document, and `409` as a stale BOQ/proposal/payment retry conflict.

## Access and security notes

- Client APIs reject non-client users before any client handler runs.
- A client only sees projects matched by an accepted project invitation, matching project email, onboarding record, or active `client_project_access` row.
- Workspace membership is not sufficient for client-portal access.
- Payment submissions are recorded as invoice transactions. The API does not claim to be a payment-gateway checkout; connect Razorpay/Stripe separately and call this endpoint after the gateway confirms payment.
- Documents remain private. Use the returned `viewUrl`/download URL through the authenticated session.

## Database rollout

1. Apply migrations, including `20261030120000_client_portal_backend.sql`.
2. Run the base seed and then `supabase/client_portal_seed.sql` in a development database.
3. Import `postman/BOQ-Design-Arena-Client.postman_collection.json` and set `access_token`.

