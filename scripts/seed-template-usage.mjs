import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envLines = fs.readFileSync(".env.local", "utf8").split("\n");
const env = {};
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
  }
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
);

const WORKSPACE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TEMPLATE_ID = "e1000000-0000-4000-8000-000000000001";
const USER_ID = "6a333eed-df69-4118-ac9f-89c4f1c54ecc";

// Seeded projects matching Figma reference
const figmaProjects = [
  {
    id: "d1000000-0000-4000-8000-000000000006",
    project_code: "PRJ-USER-006",
    workspace_id: WORKSPACE_ID,
    name: "Sharma Residence",
    client_name: "Sharma Group",
    project_type: "Residential",
    status: "active",
    progress: 64,
    project_value: 5200000,
    approved_budget: 4800000,
    location: "Mumbai, Maharashtra",
    tags: ["Residential", "3BHK", "Interior"],
    created_by: USER_ID,
    source_template_id: TEMPLATE_ID,
    source_template_version: 3,
    created_at: "2026-08-18T11:23:00Z",
    updated_at: "2026-08-18T11:23:00Z",
  },
  {
    id: "d1000000-0000-4000-8000-000000000007",
    project_code: "PRJ-USER-007",
    workspace_id: WORKSPACE_ID,
    name: "Kapoor Villa",
    client_name: "Kapoor Group",
    project_type: "Residential",
    status: "active",
    progress: 38,
    project_value: 8900000,
    approved_budget: 8100000,
    location: "Pune, Maharashtra",
    tags: ["Residential", "Villa"],
    created_by: USER_ID,
    source_template_id: TEMPLATE_ID,
    source_template_version: 3,
    created_at: "2026-08-11T08:45:00Z",
    updated_at: "2026-08-16T14:10:00Z",
  },
  {
    id: "d1000000-0000-4000-8000-000000000008",
    project_code: "PRJ-USER-008",
    workspace_id: WORKSPACE_ID,
    name: "Mehta Residence",
    client_name: "Mehta Group",
    project_type: "Residential",
    status: "completed",
    progress: 100,
    project_value: 6400000,
    approved_budget: 6000000,
    location: "Mumbai, Maharashtra",
    tags: ["Residential", "3BHK"],
    created_by: USER_ID,
    source_template_id: TEMPLATE_ID,
    source_template_version: 3,
    created_at: "2026-08-03T14:34:00Z",
    updated_at: "2026-08-10T16:00:00Z",
  },
  {
    id: "d1000000-0000-4000-8000-000000000009",
    project_code: "PRJ-USER-009",
    workspace_id: WORKSPACE_ID,
    name: "Verma Penthouse",
    client_name: "Verma Family",
    project_type: "Residential",
    status: "completed",
    progress: 100,
    project_value: 11000000,
    approved_budget: 10200000,
    location: "Bangalore, Karnataka",
    tags: ["Residential", "Penthouse"],
    created_by: USER_ID,
    source_template_id: TEMPLATE_ID,
    source_template_version: 3,
    created_at: "2026-07-28T10:15:00Z",
    updated_at: "2026-08-12T11:00:00Z",
  },
  {
    id: "d1000000-0000-4000-8000-000000000010",
    project_code: "PRJ-USER-010",
    workspace_id: WORKSPACE_ID,
    name: "DLF Phase 5 Duplex",
    client_name: "Gupta Estates",
    project_type: "Residential",
    status: "active",
    progress: 85,
    project_value: 9500000,
    approved_budget: 8900000,
    location: "Gurugram, Haryana",
    tags: ["Residential", "Duplex"],
    created_by: USER_ID,
    source_template_id: TEMPLATE_ID,
    source_template_version: 2,
    created_at: "2026-07-15T09:30:00Z",
    updated_at: "2026-08-14T17:20:00Z",
  },
  {
    id: "d1000000-0000-4000-8000-000000000011",
    project_code: "PRJ-USER-011",
    workspace_id: WORKSPACE_ID,
    name: "Hiranandani Tower C",
    client_name: "Malhotra Associates",
    project_type: "Residential",
    status: "active",
    progress: 45,
    project_value: 6100000,
    approved_budget: 5700000,
    location: "Thane, Maharashtra",
    tags: ["Residential", "Tower"],
    created_by: USER_ID,
    source_template_id: TEMPLATE_ID,
    source_template_version: 2,
    created_at: "2026-06-20T12:00:00Z",
    updated_at: "2026-08-11T13:45:00Z",
  },
  {
    id: "d1000000-0000-4000-8000-000000000012",
    project_code: "PRJ-USER-012",
    workspace_id: WORKSPACE_ID,
    name: "Lodha Bellissimo 3BHK",
    client_name: "Lodha Group",
    project_type: "Residential",
    status: "completed",
    progress: 100,
    project_value: 7800000,
    approved_budget: 7200000,
    location: "Mumbai, Maharashtra",
    tags: ["Residential", "3BHK"],
    created_by: USER_ID,
    source_template_id: TEMPLATE_ID,
    source_template_version: 1,
    created_at: "2026-05-10T16:20:00Z",
    updated_at: "2026-07-05T18:00:00Z",
  },
];

async function main() {
  console.log("Upserting figma demo projects...");
  for (const p of figmaProjects) {
    const { error: pErr } = await supabase.from("projects").upsert(p, { onConflict: "id" });
    if (pErr) console.error("Error upserting project:", p.name, pErr);
  }

  const { data: tpl } = await supabase.from("project_templates").select("*").eq("id", TEMPLATE_ID).single();
  const snapshot = {
    templateId: tpl?.id || TEMPLATE_ID,
    templateCode: tpl?.template_code || "TEM-RES-2938",
    name: tpl?.name || "Premium 3BHK Residential",
    businessType: tpl?.business_type || "Residential",
    projectType: tpl?.project_type || "3BHK",
    version: 3,
  };

  const figmaUsages = [
    {
      id: "e3000000-0000-4000-8000-000000000006",
      workspace_id: WORKSPACE_ID,
      template_id: TEMPLATE_ID,
      template_version: 3,
      project_id: "d1000000-0000-4000-8000-000000000006",
      used_by: USER_ID,
      snapshot: { ...snapshot, modifications: "MINOR", ownerName: "A. Mehta" },
      created_at: "2026-08-18T11:23:00Z",
    },
    {
      id: "e3000000-0000-4000-8000-000000000007",
      workspace_id: WORKSPACE_ID,
      template_id: TEMPLATE_ID,
      template_version: 3,
      project_id: "d1000000-0000-4000-8000-000000000007",
      used_by: USER_ID,
      snapshot: { ...snapshot, modifications: "AS-IS", ownerName: "R. Singh" },
      created_at: "2026-08-11T08:45:00Z",
    },
    {
      id: "e3000000-0000-4000-8000-000000000008",
      workspace_id: WORKSPACE_ID,
      template_id: TEMPLATE_ID,
      template_version: 3,
      project_id: "d1000000-0000-4000-8000-000000000008",
      used_by: USER_ID,
      snapshot: { ...snapshot, modifications: "MINOR", ownerName: "A. Kumar" },
      created_at: "2026-08-03T14:34:00Z",
    },
    {
      id: "e3000000-0000-4000-8000-000000000009",
      workspace_id: WORKSPACE_ID,
      template_id: TEMPLATE_ID,
      template_version: 3,
      project_id: "d1000000-0000-4000-8000-000000000009",
      used_by: USER_ID,
      snapshot: { ...snapshot, modifications: "AS-IS", ownerName: "A. Mehta" },
      created_at: "2026-07-28T10:15:00Z",
    },
    {
      id: "e3000000-0000-4000-8000-000000000010",
      workspace_id: WORKSPACE_ID,
      template_id: TEMPLATE_ID,
      template_version: 2,
      project_id: "d1000000-0000-4000-8000-000000000010",
      used_by: USER_ID,
      snapshot: { ...snapshot, version: 2, modifications: "AS-IS", ownerName: "R. Singh" },
      created_at: "2026-07-15T09:30:00Z",
    },
    {
      id: "e3000000-0000-4000-8000-000000000011",
      workspace_id: WORKSPACE_ID,
      template_id: TEMPLATE_ID,
      template_version: 2,
      project_id: "d1000000-0000-4000-8000-000000000011",
      used_by: USER_ID,
      snapshot: { ...snapshot, version: 2, modifications: "MINOR", ownerName: "A. Kumar" },
      created_at: "2026-06-20T12:00:00Z",
    },
    {
      id: "e3000000-0000-4000-8000-000000000012",
      workspace_id: WORKSPACE_ID,
      template_id: TEMPLATE_ID,
      template_version: 1,
      project_id: "d1000000-0000-4000-8000-000000000012",
      used_by: USER_ID,
      snapshot: { ...snapshot, version: 1, modifications: "MAJOR", ownerName: "A. Mehta" },
      created_at: "2026-05-10T16:20:00Z",
    },
  ];

  console.log("Upserting figma usage records...");
  for (const u of figmaUsages) {
    const { error: uErr } = await supabase.from("project_template_usage").upsert(u, { onConflict: "id" });
    if (uErr) console.error("Error upserting usage:", u.id, uErr);
  }

  console.log("Done seeding template usage!");
}

main().catch(console.error);
