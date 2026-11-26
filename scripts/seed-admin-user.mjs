import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Development/demo seed for the admin surface. Run after `supabase db reset`
// or after applying all migrations. It is safe to run repeatedly.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@boq.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
const WORKSPACE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SEEDED_ADMIN_ID = "90000000-0000-4000-8000-000000000001";
const SEEDED_USER_IDS = {
  "admin@boq.com": SEEDED_ADMIN_ID,
  "designer@boq.com": "90000000-0000-4000-8000-000000000002",
  "sales@boq.com": "90000000-0000-4000-8000-000000000003",
  "manager@boq.com": "90000000-0000-4000-8000-000000000004",
};

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(fs.readFileSync(file, "utf8").split(/\r?\n/).filter(line => line && !line.trim().startsWith("#") && line.includes("=")).map(line => {
    const at = line.indexOf("=");
    return [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^['"]|['"]$/g, "")];
  }));
}

const env = { ...loadEnv(".env.local"), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");

const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const assertOk = (label, result) => { if (result.error) throw new Error(`${label}: ${result.error.message}`); return result.data; };
const upsert = (table, rows, onConflict = "id") => assertOk(`seed ${table}`, db.from(table).upsert(rows, { onConflict }));

async function ensureUser(email, password, displayName, appRole = "member") {
  const listed = await db.auth.admin.listUsers({ perPage: 1000 });
  if (listed.error && SEEDED_USER_IDS[email.toLowerCase()]) {
    const repaired = await db.auth.admin.updateUserById(SEEDED_USER_IDS[email.toLowerCase()], {
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, company_name: "Arena Design Studio" },
      app_metadata: { role: appRole, otp_bypass: true },
    });
    if (repaired.error || !repaired.data.user) throw new Error(`repair ${email}: ${repaired.error?.message || "no user returned"}`);
    return repaired.data.user;
  }
  const users = assertOk("list auth users", listed);
  let user = users.users.find(item => item.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    const created = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: displayName, company_name: "Arena Design Studio" }, app_metadata: { role: appRole, otp_bypass: true } });
    if (created.error || !created.data.user) throw new Error(`create ${email}: ${created.error?.message || "no user returned"}`);
    user = created.data.user;
  } else {
    const updated = await db.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: { display_name: displayName, company_name: "Arena Design Studio" }, app_metadata: { role: appRole, otp_bypass: true } });
    if (updated.error) throw new Error(`update ${email}: ${updated.error.message}`);
  }
  return user;
}

const now = new Date().toISOString();
const admin = await ensureUser(ADMIN_EMAIL, ADMIN_PASSWORD, "BOQ Platform Admin", "admin");
const designers = await Promise.all([
  ensureUser("designer@boq.com", "Designer@12345", "Aarav Designer"),
  ensureUser("sales@boq.com", "Sales@12345", "Meera Sales"),
  ensureUser("manager@boq.com", "Manager@12345", "Kabir Manager"),
]);

upsert("workspaces", [{ id: WORKSPACE_ID, name: "Arena Design Studio", status: "active", currency: "INR", timezone: "Asia/Kolkata", country: "India" }]);
upsert("user_profiles", [
  { user_id: admin.id, display_name: "BOQ Platform Admin", first_name: "BOQ", last_name: "Admin" },
  ...designers.map(user => ({ user_id: user.id, display_name: user.user_metadata?.display_name || "Team member" })),
], "user_id");
upsert("user_preferences", [admin, ...designers].map(user => ({ user_id: user.id, timezone: "Asia/Kolkata", locale: "en-IN" })), "user_id");
upsert("workspace_memberships", [
  { workspace_id: WORKSPACE_ID, user_id: admin.id, role: "owner", status: "active" },
  { workspace_id: WORKSPACE_ID, user_id: designers[0].id, role: "member", status: "active" },
  { workspace_id: WORKSPACE_ID, user_id: designers[1].id, role: "admin", status: "active" },
  { workspace_id: WORKSPACE_ID, user_id: designers[2].id, role: "member", status: "active" },
], "workspace_id,user_id");
upsert("onboarding_progress", [{
  workspace_id: WORKSPACE_ID,
  user_id: admin.id,
  current_step: "complete",
  completed_steps: ["account_created", "company_setup", "project_setup", "boq_setup"],
  skipped_steps: [],
  status: "completed",
}], "workspace_id,user_id");

const roleRows = [
  ["10000000-0000-4000-8000-000000000001", "Platform Admin", "Full access to workspace administration and all modules.", true, "admin"],
  ["10000000-0000-4000-8000-000000000002", "Designer", "Create and maintain design deliverables.", false, "member"],
  ["10000000-0000-4000-8000-000000000003", "Sales", "Manage leads, calls, and client follow-up.", false, "member"],
  ["10000000-0000-4000-8000-000000000004", "Project Manager", "Manage projects, rooms, BOQs, and approvals.", false, "admin"],
].map(([id, name, description, is_system, system_fallback]) => ({ id, workspace_id: WORKSPACE_ID, name, description, is_system, system_fallback }));
upsert("workspace_roles", roleRows, "id");

upsert("subscription_plans", [
  { code: "starter", name: "Starter", description: "For small design teams.", monthly_price: 4999, currency: "INR", sort_order: 1, active: true, limits: { users: 5, projects: 20 }, features: { reports: "basic", support: "standard" } },
  { code: "professional", name: "Professional", description: "For growing construction teams.", monthly_price: 9999, currency: "INR", sort_order: 2, active: true, limits: { users: 20, projects: 100 }, features: { reports: "full", support: "priority" } },
  { code: "business", name: "Business", description: "For organizations that need scale.", monthly_price: 18000, currency: "INR", sort_order: 3, active: true, limits: { users: 50, projects: null }, features: { reports: "advanced", support: "priority" } },
  { code: "enterprise", name: "Enterprise", description: "Custom requirements at scale.", monthly_price: null, currency: "INR", sort_order: 4, active: true, limits: { users: null, projects: null }, features: { support: "dedicated" } },
], "code");
upsert("workspace_subscriptions", [{ workspace_id: WORKSPACE_ID, plan_code: "professional", status: "active", billing_frequency: "monthly", billing_contact: ADMIN_EMAIL, seats_used: 4, period_start: "2026-11-01", period_end: "2026-12-01" }], "workspace_id");

const projects = [
  ["20000000-0000-4000-8000-000000000001", "PRJ-ADMIN-001", "Mehta Residence — Bandra", "Mehta Family", "Residential", "in_progress", 68],
  ["20000000-0000-4000-8000-000000000002", "PRJ-ADMIN-002", "Kohinoor Office — Level 4", "Kohinoor Group", "Commercial", "active", 42],
  ["20000000-0000-4000-8000-000000000003", "PRJ-ADMIN-003", "Lakeview Villa — Lavasa", "Sharma Family", "Residential", "planning", 18],
].map(([id, project_code, name, client_name, project_type, status, progress]) => ({ id, workspace_id: WORKSPACE_ID, project_code, name, client_name, project_type, status, progress, location: "Maharashtra, India", project_value: 4800000, approved_budget: 4250000, created_by: admin.id }));
upsert("projects", projects, "id");

const leads = [
  ["30000000-0000-4000-8000-000000000001", "LEAD-ADMIN-001", "Rohan Mehta", "rohan.mehta@example.com", "+91 9876543210", "Mumbai, Maharashtra", "referral", "qualified", projects[0]["id"]],
  ["30000000-0000-4000-8000-000000000002", "LEAD-ADMIN-002", "Priya Shah", "priya.shah@example.com", "+91 9876543211", "Pune, Maharashtra", "custom_website", "contacted", projects[1]["id"]],
  ["30000000-0000-4000-8000-000000000003", "LEAD-ADMIN-003", "Nikhil Oberoi", "nikhil.oberoi@example.com", "+91 9876543212", "Bandra West, Mumbai", "google_ads", "new", null],
  ["30000000-0000-4000-8000-000000000004", "LEAD-ADMIN-004", "Ananya Bose", "ananya.bose@example.com", "+91 9876543213", "Indiranagar, Bengaluru", "meta_ads", "interested", projects[2]["id"]],
].map(([id, lead_code, name, email, phone, location, source, stage, project_id], index) => ({ id, workspace_id: WORKSPACE_ID, lead_code, name, email, phone, location, source, stage, project_id, assigned_to: designers[index % designers.length].id, created_by: admin.id, last_contacted_at: index === 0 ? now : null, sort_order: index }));
upsert("leads", leads, "id");
upsert("lead_call_logs", [
  { id: "31000000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID, lead_id: leads[0].id, code: "CALL-ADMIN-001", title: "Initial discovery call", call_type: "outbound", status: "connected", duration_minutes: 28, notes: "Discussed scope, style direction, and tentative timeline.", called_at: now, created_by: designers[1].id },
  { id: "31000000-0000-4000-8000-000000000002", workspace_id: WORKSPACE_ID, lead_id: leads[1].id, code: "CALL-ADMIN-002", title: "Follow-up call", call_type: "inbound", status: "scheduled", duration_minutes: null, notes: "Client will share floor plan before next call.", called_at: new Date(Date.now() + 86400000).toISOString(), created_by: admin.id },
], "id");
upsert("lead_notes", [
  { id: "32000000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID, lead_id: leads[0].id, code: "NOTE-ADMIN-001", title: "Preferred design direction", body: "Warm contemporary with natural stone, oak, and concealed storage.", note_type: "preference", visibility: "team", project_id: projects[0].id, attachments: [], created_by: admin.id },
  { id: "32000000-0000-4000-8000-000000000002", workspace_id: WORKSPACE_ID, lead_id: leads[2].id, code: "NOTE-ADMIN-002", title: "Needs site visit", body: "Schedule a site measurement after the first consultation.", note_type: "follow_up", visibility: "team", project_id: null, attachments: [], created_by: designers[1].id },
], "id");
upsert("mood_boards", [
  { id: "33000000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID, name: "Mehta Residence — Warm Contemporary", description: "Reference direction for the residence concept.", project_id: projects[0].id, lead_id: leads[0].id, mode: "template", status: "IN_PROGRESS", categories: [{ id: "living", name: "Living Room", color: "#2563EB" }, { id: "materials", name: "Materials", color: "#F59E0B" }], images: [], created_by: admin.id },
  { id: "33000000-0000-4000-8000-000000000002", workspace_id: WORKSPACE_ID, name: "Kohinoor Office — Modern Minimal", description: "Office palette and furniture references.", project_id: projects[1].id, lead_id: leads[1].id, mode: "blank", status: "COMPLETED", categories: [{ id: "workspace", name: "Workspace", color: "#16A34A" }], images: [], created_by: designers[0].id },
], "id");

upsert("project_rooms", [
  { id: "34000000-0000-4000-8000-000000000001", workspace_id: WORKSPACE_ID, project_id: projects[0].id, name: "Master Bedroom", room_type: "Bedroom", length: 14, width: 12, height: 10, unit: "ft", sort_order: 1, created_by: admin.id },
  { id: "34000000-0000-4000-8000-000000000002", workspace_id: WORKSPACE_ID, project_id: projects[0].id, name: "Living Room", room_type: "Living Room", length: 22, width: 18, height: 10, unit: "ft", sort_order: 2, created_by: admin.id },
], "id");
upsert("workspace_settings", [{ workspace_id: WORKSPACE_ID, branding: { companyName: "Arena Design Studio", primaryColor: "#2563EB" }, security: { twoFactorEnabled: true }, updated_by: admin.id }], "workspace_id");

console.log(JSON.stringify({
  admin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, userId: admin.id, workspaceId: WORKSPACE_ID, role: "owner" },
  team: designers.map(user => ({ email: user.email, password: "see seed script", userId: user.id })),
  seeded: { plans: 4, roles: roleRows.length, projects: projects.length, leads: leads.length, callLogs: 2, notes: 2, moodBoards: 2, rooms: 2 },
}, null, 2));
