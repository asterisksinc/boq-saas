import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const EMAIL = "demo@boq.com";
const PASSWORD = "demo@12345";
const USER_ROLE = "user";
const MEMBERSHIP_ROLE = "member";
const WORKSPACE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function loadEnv(path) {
  return Object.fromEntries(
    fs.readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      }),
  );
}

const env = loadEnv(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  throw new Error("Missing Supabase settings in .env.local");
}

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const publicClient = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function assertResult(label, result) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function resolveUser() {
  const signedIn = await publicClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (!signedIn.error && signedIn.data.user) return signedIn.data.user;

  const created = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: "Demo User", company_name: "BOQ Demo Workspace" },
    app_metadata: { role: USER_ROLE },
  });
  if (created.error || !created.data.user) {
    throw new Error(`create demo user: ${created.error?.message ?? "no user returned"}`);
  }
  return created.data.user;
}

async function upsert(table, rows, onConflict = "id") {
  assertResult(`seed ${table}`, await admin.from(table).upsert(rows, { onConflict }));
}

const user = await resolveUser();
const userId = user.id;
const now = new Date().toISOString();

assertResult("normalize demo user credentials and metadata", await admin.auth.admin.updateUserById(userId, {
  password: PASSWORD,
  email_confirm: true,
  user_metadata: { display_name: "Demo User", company_name: "Arena Design Studio" },
  app_metadata: { role: USER_ROLE },
}));

const workspace = assertResult(
  "find demo workspace",
  await admin.from("workspaces").select("id,name").eq("id", WORKSPACE_ID).maybeSingle(),
);
if (!workspace) throw new Error(`Demo workspace ${WORKSPACE_ID} does not exist; apply supabase/seed.sql first.`);

const oldMemberships = assertResult(
  "find existing memberships",
  await admin.from("workspace_memberships").select("workspace_id,role").eq("user_id", userId),
);

await upsert("workspace_memberships", [{
  workspace_id: WORKSPACE_ID,
  user_id: userId,
  role: MEMBERSHIP_ROLE,
  status: "active",
  joined_at: "2020-01-01T00:00:00.000Z",
}], "workspace_id,user_id");
await upsert("user_profiles", [{ user_id: userId, display_name: "Demo User", avatar_url: null }], "user_id");
await upsert("user_preferences", [{ user_id: userId, timezone: "Asia/Kolkata", locale: "en-IN" }], "user_id");
await upsert("onboarding_progress", [{
  workspace_id: WORKSPACE_ID,
  user_id: userId,
  current_step: "complete",
  completed_steps: ["account_created", "company_setup", "project_setup", "boq_setup"],
  skipped_steps: [],
  status: "completed",
}], "workspace_id,user_id");

// Account creation makes a private owner workspace. Remove only that newly-created
// empty workspace after the demo membership is ready, so this account opens the
// populated shared demo workspace first.
for (const membership of oldMemberships ?? []) {
  if (membership.workspace_id !== WORKSPACE_ID && membership.role === "owner") {
    assertResult(
      `remove temporary workspace ${membership.workspace_id}`,
      await admin.from("workspaces").delete().eq("id", membership.workspace_id),
    );
  }
}

const projects = [
  ["d1000000-0000-4000-8000-000000000001", "PRJ-USER-001", "Oberoi Residence — Bandra West", "Nikhil Oberoi", "Residential", "in_progress", 68, 4800000, 4250000],
  ["d1000000-0000-4000-8000-000000000002", "PRJ-USER-002", "Kohinoor Office — Level 4", "Kohinoor Group", "Commercial", "active", 42, 12500000, 11000000],
  ["d1000000-0000-4000-8000-000000000003", "PRJ-USER-003", "Lakeview Villa — Lavasa", "Sharma Family", "Residential", "on_hold", 35, 7500000, 6800000],
  ["d1000000-0000-4000-8000-000000000004", "PRJ-USER-004", "Nexus Retail Fit-Out — Pune", "Nexus Malls Pvt. Ltd.", "Retail", "completed", 100, 9200000, 8700000],
  ["d1000000-0000-4000-8000-000000000005", "PRJ-USER-005", "Studio 47 — Interior Redo", "Ananya Bose", "Studio", "planning", 10, 1200000, 980000],
].map(([id, project_code, name, client_name, project_type, status, progress, project_value, approved_budget]) => ({
  id, project_code, workspace_id: WORKSPACE_ID, name, client_name, project_type, status,
  progress, project_value, approved_budget, location: "Maharashtra, India",
  description: "Seeded demo project for product walkthroughs.", tags: [project_type, "Demo"], created_by: userId,
}));
await upsert("projects", projects);

await upsert("project_rooms", [
  { id: "d2000000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID, project_id: projects[0].id, name: "Master Bedroom", room_type: "Bedroom", length: 14, width: 12, height: 10, unit: "ft", sort_order: 1, created_by: userId },
  { id: "d2000000-0000-4000-8000-000000000002", workspace_id: WORKSPACE_ID, project_id: projects[0].id, name: "Living Room", room_type: "Living Room", length: 22, width: 18, height: 10, unit: "ft", sort_order: 2, created_by: userId },
  { id: "d2000000-0000-4000-8000-000000000003", workspace_id: WORKSPACE_ID, project_id: projects[0].id, name: "Kitchen", room_type: "Kitchen", length: 14, width: 10, height: 10, unit: "ft", sort_order: 3, created_by: userId },
]);

await upsert("boqs", [{
  id: "d3000000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID,
  project_id: projects[0].id, boq_number: "BOQ-USER-001", version: "v1", assigned_to: userId,
  source_method: "blank", status: "in_review", markup_percent: 12, tax_percent: 18,
  created_by: userId, updated_by: userId,
}]);
await upsert("boq_rooms", [
  { id: "d3100000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID, boq_id: "d3000000-0000-4000-8000-000000000001", name: "Master Bedroom", sort_order: 1 },
  { id: "d3100000-0000-4000-8000-000000000002", workspace_id: WORKSPACE_ID, boq_id: "d3000000-0000-4000-8000-000000000001", name: "Living Room", sort_order: 2 },
]);
await upsert("boq_categories", [
  { id: "d3200000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID, boq_id: "d3000000-0000-4000-8000-000000000001", room_id: "d3100000-0000-4000-8000-000000000001", name: "Furniture", sort_order: 1 },
  { id: "d3200000-0000-4000-8000-000000000002", workspace_id: WORKSPACE_ID, boq_id: "d3000000-0000-4000-8000-000000000001", room_id: "d3100000-0000-4000-8000-000000000002", name: "Joinery", sort_order: 1 },
]);
await upsert("boq_items", [
  { id: "d3300000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID, boq_id: "d3000000-0000-4000-8000-000000000001", room_id: "d3100000-0000-4000-8000-000000000001", category_id: "d3200000-0000-4000-8000-000000000001", name: "Full-height wardrobe", unit: "nos", quantity: 1, rate: 850000, waste_percent: 3, tax_percent: 18, sort_order: 1 },
  { id: "d3300000-0000-4000-8000-000000000002", workspace_id: WORKSPACE_ID, boq_id: "d3000000-0000-4000-8000-000000000001", room_id: "d3100000-0000-4000-8000-000000000002", category_id: "d3200000-0000-4000-8000-000000000002", name: "TV feature unit", unit: "nos", quantity: 1, rate: 320000, waste_percent: 2, tax_percent: 18, sort_order: 1 },
]);

await upsert("proposals", [{
  id: "d4000000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID,
  project_id: projects[0].id, project_name: projects[0].name, client_name: projects[0].client_name,
  source_type: "boq", source_id: "d3000000-0000-4000-8000-000000000001", source_label: "BOQ-USER-001 v1",
  proposed_value: 3950000, currency: "INR", expiry_date: "2026-09-30",
  scope_items: ["Design and detailing", "Furniture and joinery", "Site coordination"],
  status: "sent", view_count: 2, sent_at: now, created_by: userId, updated_by: userId,
}]);

await upsert("invoices", [{
  id: "d5000000-0000-4000-8000-000000000001", manual_number: "INV-USER-DEMO-001",
  workspace_id: WORKSPACE_ID, document_type: "invoice", client_name: projects[0].client_name,
  billing_address: { line1: "Bandra West", city: "Mumbai", state: "Maharashtra", pincode: "400050" },
  project_id: projects[0].id, project_name: projects[0].name, issue_date: "2026-08-24", due_date: "2026-09-10",
  milestone: "Milestone 2 — BOQ Approval", tax_rate: 18, subtotal: 260000, tax_amount: 46800,
  total_amount: 306800, total_paid: 100000, currency: "INR", status: "partial", sent_at: now,
  created_by: userId, updated_by: userId,
}]);
await upsert("invoice_items", [
  { id: "d5100000-0000-4000-8000-000000000001", invoice_id: "d5000000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID, position: 1, description: "Interior Design Services — Stage 2", quantity: 1, rate: 220000 },
  { id: "d5100000-0000-4000-8000-000000000002", invoice_id: "d5000000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID, position: 2, description: "Project Management", quantity: 1, rate: 40000 },
]);
await upsert("invoice_payments", [{
  id: "d5200000-0000-4000-8000-000000000001", invoice_id: "d5000000-0000-4000-8000-000000000001",
  workspace_id: WORKSPACE_ID, amount: 100000, paid_at: now, method: "bank_transfer",
  reference: "UTR-USER-DEMO-001", notes: "Seeded partial payment", recorded_by: userId,
}]);

await upsert("notifications", [{
  id: "d9000000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID,
  recipient_user_id: userId, type: "welcome", title: "Welcome — your demo workspace is ready",
  priority: "normal", target_type: "workspace", target_id: WORKSPACE_ID, read_at: null,
}]);

const counts = {};
for (const table of ["projects", "boqs", "boq_items", "proposals", "invoices", "notifications"]) {
  const result = await admin.from(table).select("id", { count: "exact", head: true }).eq("workspace_id", WORKSPACE_ID);
  assertResult(`verify ${table}`, result);
  counts[table] = result.count;
}

const verified = await publicClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
assertResult("verify password login", verified);
const context = assertResult("verify user context", await publicClient.rpc("get_current_context"));

console.log(JSON.stringify({
  user: { id: userId, email: EMAIL, appRole: USER_ROLE },
  workspace: { id: context.workspace.id, name: context.workspace.name, membershipRole: context.membership.role },
  seededRowCounts: counts,
}, null, 2));
